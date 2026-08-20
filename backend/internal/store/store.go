package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/anga/backend/internal/models"
	"github.com/jmoiron/sqlx"
)

type Store struct {
	db *sqlx.DB
}

func New(db *sqlx.DB) *Store {
	s := &Store{db: db}
	s.runMigrations()
	s.seedDefaultIncidents()
	return s
}

// runMigrations automatically runs our schema file on startup
func (s *Store) runMigrations() {
	schema := `
	CREATE TABLE IF NOT EXISTS incidents (
		id VARCHAR(10) PRIMARY KEY,
		title TEXT NOT NULL,
		hazard_type VARCHAR(20) NOT NULL,
		severity VARCHAR(20) NOT NULL,
		location TEXT NOT NULL,
		coordinates DOUBLE PRECISION[] NOT NULL,
		reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		status VARCHAR(20) NOT NULL DEFAULT 'active',
		department VARCHAR(50) NOT NULL,
		assigned_to TEXT NOT NULL,
		actions_taken JSONB DEFAULT '[]',
		automated_dispatch_sent BOOLEAN DEFAULT true,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_incidents_hazard_type ON incidents(hazard_type);
	CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
	CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
	CREATE INDEX IF NOT EXISTS idx_incidents_reported_at ON incidents(reported_at);
	`
	_, err := s.db.Exec(schema)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}
	log.Println("Database migrations checked/applied successfully.")
}

// seedDefaultIncidents populates initial sample data if table is empty
func (s *Store) seedDefaultIncidents() {
	var count int
	err := s.db.Get(&count, "SELECT COUNT(*) FROM incidents")
	if err != nil || count > 0 {
		return
	}

	now := time.Now()
	initials := []models.Incident{
		{
			ID:          "INC-8491",
			Title:       "River Basalt Stage 3 Flash Inundation Warning",
			HazardType:  models.HazardFlood,
			Severity:    models.SeverityCritical,
			Location:    "Lower Valley District & Industrial Park",
			Coordinates: [2]float64{51.5074, -0.1278},
			ReportedAt:  now.Add(-45 * time.Minute),
			Status:      models.StatusInProgress,
			Department:  models.DeptEmergencyMgmt,
			AssignedTo:  "Commander Vance & Team Alpha",
			ActionsTaken: []string{
				"Deployed automated telemetry stream-gauge warning sirens",
				"Evacuated low-lying SME warehousing zone 4",
				"Activated mobile high-volume flood water pumps",
			},
			AutomatedDispatchSent: true,
		},
		{
			ID:          "INC-8492",
			Title:       "Agricultural Zone Soil Moisture Critical Deficit (12%)",
			HazardType:  models.HazardDrought,
			Severity:    models.SeverityHigh,
			Location:    "Eastern Irrigation Basin & Grain Corridors",
			Coordinates: [2]float64{51.48, -0.05},
			ReportedAt:  now.Add(-120 * time.Minute),
			Status:      models.StatusActive,
			Department:  models.DeptAgriculture,
			AssignedTo:  "Dr. Aris (Agronomy Division)",
			ActionsTaken: []string{
				"Notified 45 local farming collectives via CAP broadcast",
				"Scheduled regulated emergency aquifer allocation tier-2",
			},
			AutomatedDispatchSent: true,
		},
	}

	for _, inc := range initials {
		actionsJSON, _ := json.Marshal(inc.ActionsTaken)
		_, _ = s.db.Exec(`
			INSERT INTO incidents (id, title, hazard_type, severity, location, coordinates, reported_at, status, department, assigned_to, actions_taken, automated_dispatch_sent)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO NOTHING`,
			inc.ID, inc.Title, inc.HazardType, inc.Severity, inc.Location, pqArray(inc.Coordinates[:]), inc.ReportedAt, inc.Status, inc.Department, inc.AssignedTo, actionsJSON, inc.AutomatedDispatchSent,
		)
	}
	log.Println("Default incidents seeded into PostgreSQL.")
}

// Helper struct for scanning database rows where JSONB actions are handled
type dbIncident struct {
	ID                    string          `db:"id"`
	Title                 string          `db:"title"`
	HazardType            string          `db:"hazard_type"`
	Severity              string          `db:"severity"`
	Location              string          `db:"location"`
	Coordinates           []float64       `db:"coordinates"`
	ReportedAt            time.Time       `db:"reported_at"`
	Status                string          `db:"status"`
	Department            string          `db:"department"`
	AssignedTo            string          `db:"assigned_to"`
	ActionsTaken          json.RawMessage `db:"actions_taken"`
	AutomatedDispatchSent bool            `db:"automated_dispatch_sent"`
}

func toModelIncident(d dbIncident) models.Incident {
	var actions []string
	_ = json.Unmarshal(d.ActionsTaken, &actions)
	if actions == nil {
		actions = []string{}
	}

	var coords [2]float64
	if len(d.Coordinates) >= 2 {
		coords = [2]float64{d.Coordinates[0], d.Coordinates[1]}
	}

	return models.Incident{
		ID:                    d.ID,
		Title:                 d.Title,
		HazardType:            models.HazardType(d.HazardType),
		Severity:              models.SeverityLevel(d.Severity),
		Location:              d.Location,
		Coordinates:           coords,
		ReportedAt:            d.ReportedAt,
		Status:                models.IncidentStatus(d.Status),
		Department:            models.Department(d.Department),
		AssignedTo:            d.AssignedTo,
		ActionsTaken:          actions,
		AutomatedDispatchSent: d.AutomatedDispatchSent,
	}
}

// Helper for postgres array formatting
type float64SliceLiteral []float64

func pqArray(s []float64) string {
	bytes, _ := json.Marshal(s)
	// Convert JSON array [a,b] to Postgres array format {a,b}
	res := "{"
	for i, v := range s {
		if i > 0 {
			res += ","
		}
		res += fmt.Sprintf("%f", v)
	}
	res += "}"
	_ = bytes
	return res
}

func (s *Store) GetIncidents() []models.Incident {
	var dbIncidents []dbIncident
	err := s.db.Select(&dbIncidents, "SELECT * FROM incidents ORDER BY reported_at DESC")
	if err != nil {
		log.Printf("Error fetching incidents: %v", err)
		return []models.Incident{}
	}

	var incidents []models.Incident
	for _, di := range dbIncidents {
		incidents = append(incidents, toModelIncident(di))
	}
	return incidents
}

func (s *Store) GetIncidentByID(id string) *models.Incident {
	var di dbIncident
	err := s.db.Get(&di, "SELECT * FROM incidents WHERE id = $1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}
		log.Printf("Error fetching incident %s: %v", id, err)
		return nil
	}
	inc := toModelIncident(di)
	return &inc
}

func (s *Store) CreateIncident(req models.CreateIncidentRequest) models.Incident {
	id := fmt.Sprintf("INC-%d", 1000+rand.Intn(9000))
	
	title := req.Title
	if title == "" {
		title = "Automated Climate Anomaly Alert"
	}
	hazardType := req.HazardType
	if hazardType == "" {
		hazardType = models.HazardFlood
	}
	severity := req.Severity
	if severity == "" {
		severity = models.SeverityModerate
	}
	location := req.Location
	if location == "" {
		location = "Sector 7"
	}
	coords := req.Coordinates
	if coords == [2]float64{} {
		coords = [2]float64{51.5074, -0.1278}
	}
	department := req.Department
	if department == "" {
		department = models.DeptEmergencyMgmt
	}
	assignedTo := req.AssignedTo
	if assignedTo == "" {
		assignedTo = "Automated Dispatch System"
	}
	actions := req.ActionsTaken
	if len(actions) == 0 {
		actions = []string{"Dispatched automated early warning beacon", "Logged in municipal resilience ledger"}
	}

	actionsJSON, _ := json.Marshal(actions)
	now := time.Now()

	_, err := s.db.Exec(`
		INSERT INTO incidents (id, title, hazard_type, severity, location, coordinates, reported_at, status, department, assigned_to, actions_taken, automated_dispatch_sent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		id, title, hazardType, severity, location, pqArray(coords[:]), now, models.StatusActive, department, assignedTo, actionsJSON, true,
	)

	if err != nil {
		log.Printf("Error creating incident: %v", err)
	}

	return models.Incident{
		ID:                    id,
		Title:                 title,
		HazardType:            hazardType,
		Severity:              severity,
		Location:              location,
		Coordinates:           coords,
		ReportedAt:            now,
		Status:                models.StatusActive,
		Department:            department,
		AssignedTo:            assignedTo,
		ActionsTaken:          actions,
		AutomatedDispatchSent: true,
	}
}

func (s *Store) UpdateIncident(id string, req models.UpdateIncidentRequest) *models.Incident {
	existing := s.GetIncidentByID(id)
	if existing == nil {
		return nil
	}

	status := existing.Status
	if req.Status != nil {
		status = *req.Status
	}

	assignedTo := existing.AssignedTo
	if req.AssignedTo != nil {
		assignedTo = *req.AssignedTo
	}

	actions := existing.ActionsTaken
	if req.ActionsTaken != nil {
		actions = append(actions, req.ActionsTaken...)
	}

	actionsJSON, _ := json.Marshal(actions)

	_, err := s.db.Exec(`
		UPDATE incidents 
		SET status = $1, assigned_to = $2, actions_taken = $3, updated_at = NOW()
		WHERE id = $4`,
		status, assignedTo, actionsJSON, id,
	)

	if err != nil {
		log.Printf("Error updating incident %s: %v", id, err)
		return nil
	}

	existing.Status = status
	existing.AssignedTo = assignedTo
	existing.ActionsTaken = actions
	return existing
}

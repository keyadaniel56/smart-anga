package store

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/anga/backend/internal/models"
)

type Store struct {
	mu        sync.RWMutex
	incidents []models.Incident
	smes      []models.SMEProfile
}

func New() *Store {
	s := &Store{}
	s.seedIncidents()
	return s
}

func (s *Store) seedIncidents() {
	now := time.Now()
	s.incidents = []models.Incident{
		{
			ID:         "INC-8491",
			Title:      "River Basalt Stage 3 Flash Inundation Warning",
			HazardType: models.HazardFlood,
			Severity:   models.SeverityCritical,
			Location:   "Lower Valley District & Industrial Park",
			Coordinates: [2]float64{51.5074, -0.1278},
			ReportedAt: now.Add(-45 * time.Minute),
			Status:     models.StatusInProgress,
			Department: models.DeptEmergencyMgmt,
			AssignedTo: "Commander Vance & Team Alpha",
			ActionsTaken: []string{
				"Deployed automated telemetry stream-gauge warning sirens",
				"Evacuated low-lying SME warehousing zone 4",
				"Activated mobile high-volume flood water pumps",
			},
			AutomatedDispatchSent: true,
		},
		{
			ID:         "INC-8492",
			Title:      "Agricultural Zone Soil Moisture Critical Deficit (12%)",
			HazardType: models.HazardDrought,
			Severity:   models.SeverityHigh,
			Location:   "Eastern Irrigation Basin & Grain Corridors",
			Coordinates: [2]float64{51.48, -0.05},
			ReportedAt: now.Add(-120 * time.Minute),
			Status:     models.StatusActive,
			Department: models.DeptAgriculture,
			AssignedTo: "Dr. Aris (Agronomy Division)",
			ActionsTaken: []string{
				"Notified 45 local farming collectives via CAP broadcast",
				"Scheduled regulated emergency aquifer allocation tier-2",
			},
			AutomatedDispatchSent: true,
		},
		{
			ID:         "INC-8493",
			Title:      "Urban Heat Island Grid Overload Alert (41.5°C Index)",
			HazardType: models.HazardHeatwave,
			Severity:   models.SeverityHigh,
			Location:   "Downtown Commercial Core & Central Transit",
			Coordinates: [2]float64{51.52, -0.14},
			ReportedAt: now.Add(-180 * time.Minute),
			Status:     models.StatusInProgress,
			Department: models.DeptHealthcare,
			AssignedTo: "Metro Paramedic Rapid Response",
			ActionsTaken: []string{
				"Opened 6 municipal public cooling shelters with emergency hydration",
				"Dispatched grid load-shedding protocol to municipal substation #3",
			},
			AutomatedDispatchSent: true,
		},
	}
}

func (s *Store) GetIncidents() []models.Incident {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Incident, len(s.incidents))
	copy(out, s.incidents)
	return out
}

func (s *Store) GetIncidentByID(id string) *models.Incident {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.incidents {
		if s.incidents[i].ID == id {
			return &s.incidents[i]
		}
	}
	return nil
}

func (s *Store) CreateIncident(req models.CreateIncidentRequest) models.Incident {
	s.mu.Lock()
	defer s.mu.Unlock()

	inc := models.Incident{
		ID:         fmt.Sprintf("INC-%d", 1000+rand.Intn(9000)),
		Title:      req.Title,
		HazardType: req.HazardType,
		Severity:   req.Severity,
		Location:   req.Location,
		Coordinates: req.Coordinates,
		ReportedAt: time.Now(),
		Status:     models.StatusActive,
		Department: req.Department,
		AssignedTo: req.AssignedTo,
		ActionsTaken: req.ActionsTaken,
		AutomatedDispatchSent: true,
	}

	if inc.Title == "" {
		inc.Title = "Automated Climate Anomaly Alert"
	}
	if inc.HazardType == "" {
		inc.HazardType = models.HazardFlood
	}
	if inc.Severity == "" {
		inc.Severity = models.SeverityModerate
	}
	if inc.Location == "" {
		inc.Location = "Sector 7"
	}
	if inc.Coordinates == [2]float64{} {
		inc.Coordinates = [2]float64{51.5074, -0.1278}
	}
	if inc.Department == "" {
		inc.Department = models.DeptEmergencyMgmt
	}
	if inc.AssignedTo == "" {
		inc.AssignedTo = "Automated Dispatch System"
	}
	if len(inc.ActionsTaken) == 0 {
		inc.ActionsTaken = []string{
			"Dispatched automated early warning beacon",
			"Logged in municipal resilience ledger",
		}
	}

	s.incidents = append([]models.Incident{inc}, s.incidents...)
	return inc
}

func (s *Store) UpdateIncident(id string, req models.UpdateIncidentRequest) *models.Incident {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.incidents {
		if s.incidents[i].ID == id {
			if req.Status != nil {
				s.incidents[i].Status = *req.Status
			}
			if req.ActionsTaken != nil {
				s.incidents[i].ActionsTaken = append(s.incidents[i].ActionsTaken, req.ActionsTaken...)
			}
			if req.AssignedTo != nil {
				s.incidents[i].AssignedTo = *req.AssignedTo
			}
			return &s.incidents[i]
		}
	}
	return nil
}

// ──────────────────────────────── Asset store ────────────────────────────────

// AssetRecord is a vulnerable infrastructure asset in the internal database.
type AssetRecord struct {
	ID          string
	Name        string
	Type        string
	Coordinates [2]float64
}

var seededAssets = []AssetRecord{
	// Schools
	{"school-001", "Nairobi Primary School", "school", [2]float64{-1.2830, 36.8200}},
	{"school-002", "Westlands Academy", "school", [2]float64{-1.2680, 36.8100}},
	// Hospitals
	{"hospital-001", "Kenyatta National Hospital", "hospital", [2]float64{-1.3010, 36.8070}},
	{"hospital-002", "Nairobi West Hospital", "hospital", [2]float64{-1.3120, 36.8150}},
	// Roads & Bridges
	{"road-001", "Uhuru Highway Junction", "road", [2]float64{-1.2900, 36.8220}},
	{"bridge-001", "Nairobi River Bridge A", "bridge", [2]float64{-1.2850, 36.8300}},
	{"bridge-002", "Ngong Road Overpass", "bridge", [2]float64{-1.3005, 36.7990}},
	// Farms
	{"farm-001", "Kikuyu Agricultural Zone", "farm", [2]float64{-1.2500, 36.7800}},
	{"farm-002", "Ruiru Grain Corridor", "farm", [2]float64{-1.1450, 36.9600}},
	// Businesses
	{"business-001", "CBD Commercial Hub", "business", [2]float64{-1.2833, 36.8172}},
	{"business-002", "Industrial Area SME Park", "business", [2]float64{-1.3100, 36.8400}},
	// Water infrastructure
	{"water-001", "Nairobi Water Treatment Plant", "water", [2]float64{-1.2600, 36.8050}},
	{"water-002", "Embakasi Pumping Station", "water", [2]float64{-1.3200, 36.8900}},
	// Population centres
	{"pop-001", "Kibera Residential Zone", "population", [2]float64{-1.3120, 36.7870}},
	{"pop-002", "Eastleigh District", "population", [2]float64{-1.2740, 36.8490}},
	// Energy
	{"energy-001", "Nairobi Power Substation #1", "energy", [2]float64{-1.2960, 36.8260}},
	// Utilities
	{"utilities-001", "Sewage Treatment Works", "utilities", [2]float64{-1.3050, 36.8320}},
}

// GetAssets returns all asset records from the internal database.
func (s *Store) GetAssets() []AssetRecord {
	return seededAssets
}

// ──────────────────────────────── SME store ──────────────────────────────────

func (s *Store) initSMEs() {
	if s.smes == nil {
		s.smes = []models.SMEProfile{}
	}
}

// GetSME returns the SME with the given ID, or nil if not found.
func (s *Store) GetSME(id string) *models.SMEProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.smes {
		if s.smes[i].ID == id {
			cp := s.smes[i]
			return &cp
		}
	}
	return nil
}

// CreateSME persists a new SME profile and returns it.
func (s *Store) CreateSME(req models.RegisterSMERequest) models.SMEProfile {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.initSMEs()

	now := time.Now().UTC()
	sme := models.SMEProfile{
		ID:                fmt.Sprintf("SME-%04d", 1000+rand.Intn(9000)),
		BusinessName:      req.BusinessName,
		Industry:          req.Industry,
		EmployeeCount:     req.EmployeeCount,
		Location:          req.Location,
		Coordinates:       req.Coordinates,
		HasInsurance:      req.HasInsurance,
		InsuranceCovers:   req.InsuranceCovers,
		EmergencyMeasures: req.EmergencyMeasures,
		CriticalAssets:    req.CriticalAssets,
		RegisteredAt:      now,
		UpdatedAt:         now,
	}
	if sme.BusinessName == "" {
		sme.BusinessName = "Unnamed Business"
	}
	if sme.Industry == "" {
		sme.Industry = models.IndustryOther
	}
	if sme.InsuranceCovers == nil {
		sme.InsuranceCovers = []string{}
	}
	if sme.EmergencyMeasures == nil {
		sme.EmergencyMeasures = []models.EmergencyMeasure{}
	}
	if sme.CriticalAssets == nil {
		sme.CriticalAssets = []models.CriticalAsset{}
	}

	s.smes = append(s.smes, sme)
	return sme
}

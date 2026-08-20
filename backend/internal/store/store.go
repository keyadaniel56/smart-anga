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
    users     []models.User
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

func (s *Store) CreateUser(user models.User) error {
        s.mu.Lock()
        defer s.mu.Unlock()

        // Check if username already exists
        for _, u := range s.users {
                if u.Username == user.Username {
                        return fmt.Errorf("username already exists")
                }
        }

        user.ID = len(s.users) + 1
        user.CreatedAt = time.Now()
        s.users = append(s.users, user)
        return nil
}

func (s *Store) GetUserByUsername(username string) (*models.User, error) {
        s.mu.RLock()
        defer s.mu.RUnlock()

        for i := range s.users {
                if s.users[i].Username == username {
                        return &s.users[i], nil
                }
        }
        return nil, fmt.Errorf("user not found")
}

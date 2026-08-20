package models

import "time"

type HazardType string

const (
	HazardFlood    HazardType = "flood"
	HazardDrought  HazardType = "drought"
	HazardHeatwave HazardType = "heatwave"
	HazardWildfire HazardType = "wildfire"
	HazardStorm    HazardType = "storm"
)

type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityModerate Severity = "moderate"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

type IncidentStatus string

const (
	StatusActive     IncidentStatus = "active"
	StatusInProgress IncidentStatus = "in_progress"
	StatusMitigated  IncidentStatus = "mitigated"
	StatusResolved   IncidentStatus = "resolved"
)

type Department string

const (
	DeptEmergencyMgmt Department = "Emergency Management"
	DeptPublicWorks   Department = "Public Works"
	DeptHealthcare    Department = "Healthcare"
	DeptAgriculture   Department = "Agriculture"
	DeptSMELiaison    Department = "SME Liaison"
)

type Incident struct {
	ID                   string          `json:"id"`
	Title                string          `json:"title"`
	HazardType           HazardType      `json:"hazardType"`
	Severity             Severity        `json:"severity"`
	Location             string          `json:"location"`
	Coordinates          [2]float64      `json:"coordinates"`
	ReportedAt           time.Time       `json:"reportedAt"`
	Status               IncidentStatus  `json:"status"`
	Department           Department      `json:"department"`
	AssignedTo           string          `json:"assignedTo"`
	ActionsTaken         []string        `json:"actionsTaken"`
	AutomatedDispatchSent bool          `json:"automatedDispatchSent"`
}

type CreateIncidentRequest struct {
	Title        string      `json:"title"`
	HazardType   HazardType  `json:"hazardType"`
	Severity     Severity    `json:"severity"`
	Location     string      `json:"location"`
	Coordinates  [2]float64  `json:"coordinates"`
	Department   Department  `json:"department"`
	AssignedTo   string      `json:"assignedTo"`
	ActionsTaken []string    `json:"actionsTaken"`
}

type UpdateIncidentRequest struct {
	Status     *IncidentStatus `json:"status"`
	ActionsTaken []string      `json:"actionsTaken"`
	AssignedTo *string          `json:"assignedTo"`
}

type ClimateResponse struct {
	Success     bool             `json:"success"`
	Coordinates Coordinates      `json:"coordinates"`
	Weather     interface{}      `json:"weather"`
	Flood       interface{}      `json:"flood"`
	FetchedAt   string           `json:"fetchedAt"`
}

type Coordinates struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type RiskAssessmentRequest struct {
	LocationName    string                 `json:"locationName"`
	Coordinates     [2]float64             `json:"coordinates"`
	LiveConditions  map[string]interface{} `json:"liveConditions"`
	SectorFocus     string                 `json:"sectorFocus"`
	Timeframe       string                 `json:"timeframe"`
}

type ScenarioSimulateRequest struct {
	Location              string  `json:"location"`
	Baseline              string  `json:"baseline"`
	PrecipitationDeltaPct float64 `json:"precipitationDeltaPct"`
	TemperatureDeltaC     float64 `json:"temperatureDeltaC"`
	DroughtDurationWeeks  int     `json:"droughtDurationWeeks"`
	RiverLevelMultiplier  float64 `json:"riverLevelMultiplier"`
}

type ActionPlanRequest struct {
	BusinessName   string                 `json:"businessName"`
	Industry       string                 `json:"industry"`
	EmployeeCount  string                 `json:"employeeCount"`
	Location       string                 `json:"location"`
	PrimaryThreats []string               `json:"primaryThreats"`
	CurrentMeasures map[string]interface{} `json:"currentMeasures"`
}

type ChatMessage struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type ChatAssistantRequest struct {
	Messages []ChatMessage         `json:"messages"`
	Context  map[string]interface{} `json:"context"`
}

type ReportRequest struct {
	Location     map[string]string   `json:"location"`
	Hazards      map[string]interface{} `json:"hazards"`
	Sensors      []interface{}       `json:"sensors"`
	SMEProfiles  []interface{}       `json:"smeProfiles"`
	Incidents    []interface{}       `json:"incidents"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

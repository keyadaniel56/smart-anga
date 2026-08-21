package models

import "time"

// Industry categories used for risk benchmarking.
type Industry string

const (
	IndustryAgriculture    Industry = "agriculture"
	IndustryManufacturing  Industry = "manufacturing"
	IndustryRetail         Industry = "retail"
	IndustryHealthcare     Industry = "healthcare"
	IndustryConstruction   Industry = "construction"
	IndustryLogistics      Industry = "logistics"
	IndustryHospitality    Industry = "hospitality"
	IndustryTechnology     Industry = "technology"
	IndustryFinance        Industry = "finance"
	IndustryOther          Industry = "other"
)

// EmergencyMeasure represents a preparedness action already in place.
type EmergencyMeasure string

const (
	MeasureEvacuationPlan    EmergencyMeasure = "evacuation_plan"
	MeasureFloodBarriers     EmergencyMeasure = "flood_barriers"
	MeasureBackupPower       EmergencyMeasure = "backup_power"
	MeasureWaterStorage      EmergencyMeasure = "water_storage"
	MeasureInsurance         EmergencyMeasure = "insurance"
	MeasureEarlyWarning      EmergencyMeasure = "early_warning_system"
	MeasureStaffTraining     EmergencyMeasure = "staff_training"
	MeasureDataBackup        EmergencyMeasure = "data_backup"
	MeasureSupplyChainBackup EmergencyMeasure = "supply_chain_backup"
	MeasureFireSuppression   EmergencyMeasure = "fire_suppression"
)

// CriticalAsset is a business asset that must be protected or accounted for.
type CriticalAsset struct {
	Name          string  `json:"name"`
	Type          string  `json:"type"`           // equipment, stock, data, infrastructure
	EstimatedValue float64 `json:"estimatedValue"` // USD
	IsInsured     bool    `json:"isInsured"`
}

// SMEProfile is the core business record registered by an SME operator.
type SMEProfile struct {
	ID               string             `json:"id"`
	BusinessName     string             `json:"businessName"`
	Industry         Industry           `json:"industry"`
	EmployeeCount    int                `json:"employeeCount"`
	Location         string             `json:"location"`
	Coordinates      [2]float64         `json:"coordinates"`
	HasInsurance     bool               `json:"hasInsurance"`
	InsuranceCovers  []string           `json:"insuranceCovers"` // flood, drought, fire, etc.
	EmergencyMeasures []EmergencyMeasure `json:"emergencyMeasures"`
	CriticalAssets   []CriticalAsset    `json:"criticalAssets"`
	RegisteredAt     time.Time          `json:"registeredAt"`
	UpdatedAt        time.Time          `json:"updatedAt"`
}

// RegisterSMERequest is the POST /api/sme request body.
type RegisterSMERequest struct {
	BusinessName      string             `json:"businessName"`
	Industry          Industry           `json:"industry"`
	EmployeeCount     int                `json:"employeeCount"`
	Location          string             `json:"location"`
	Coordinates       [2]float64         `json:"coordinates"`
	HasInsurance      bool               `json:"hasInsurance"`
	InsuranceCovers   []string           `json:"insuranceCovers"`
	EmergencyMeasures []EmergencyMeasure `json:"emergencyMeasures"`
	CriticalAssets    []CriticalAsset    `json:"criticalAssets"`
}

// ──────────────────────────────── Assessment types ───────────────────────────

// VulnerabilityFactor is a named dimension of the assessment.
type VulnerabilityFactor struct {
	Name        string  `json:"name"`
	Score       float64 `json:"score"`       // 0–100 (higher = more vulnerable)
	Weight      float64 `json:"weight"`      // contribution weight
	Description string  `json:"description"`
}

// PreparednessGrade maps a score to a letter grade A–F.
type PreparednessGrade string

const (
	GradeA PreparednessGrade = "A" // 90–100
	GradeB PreparednessGrade = "B" // 75–89
	GradeC PreparednessGrade = "C" // 60–74
	GradeD PreparednessGrade = "D" // 45–59
	GradeE PreparednessGrade = "E" // 30–44
	GradeF PreparednessGrade = "F" // 0–29
)

// SMEAssessment is the result of GET /api/sme/:id/assessment.
type SMEAssessment struct {
	SMEID               string                `json:"smeId"`
	BusinessName        string                `json:"businessName"`
	Industry            Industry              `json:"industry"`
	AssessedAt          time.Time             `json:"assessedAt"`
	VulnerabilityScore  float64               `json:"vulnerabilityScore"`  // 0–100
	PreparednessScore   float64               `json:"preparednessScore"`   // 0–100
	PreparednessGrade   PreparednessGrade     `json:"preparednessGrade"`
	IndustryBenchmark   float64               `json:"industryBenchmark"`   // avg preparedness for industry
	BenchmarkDelta      float64               `json:"benchmarkDelta"`      // score minus benchmark
	Factors             []VulnerabilityFactor `json:"factors"`
	TopRisks            []string              `json:"topRisks"`
	Summary             string                `json:"summary"`
}

// ──────────────────────────────── Action plan types ──────────────────────────

// ActionPriority ranks how urgently a task should be completed.
type ActionPriority string

const (
	PriorityImmediate ActionPriority = "immediate" // within 48 hours
	PriorityShortTerm ActionPriority = "short_term" // within 30 days
	PriorityMediumTerm ActionPriority = "medium_term" // within 90 days
	PriorityLongTerm  ActionPriority = "long_term"  // 90+ days
)

// ActionTask is a single recommended action in the preparedness plan.
type ActionTask struct {
	ID           string         `json:"id"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	Priority     ActionPriority `json:"priority"`
	Hazard       string         `json:"hazard"`       // which hazard it addresses
	EstimatedCost string        `json:"estimatedCost"`
	IsCompleted  bool           `json:"isCompleted"`
}

// SMEActionPlan is the result of GET /api/sme/:id/action-plan.
type SMEActionPlan struct {
	SMEID          string       `json:"smeId"`
	BusinessName   string       `json:"businessName"`
	GeneratedAt    time.Time    `json:"generatedAt"`
	TotalTasks     int          `json:"totalTasks"`
	ImmediateCount int          `json:"immediateCount"`
	Tasks          []ActionTask `json:"tasks"`
}

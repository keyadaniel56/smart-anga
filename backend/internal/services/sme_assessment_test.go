package services

import (
	"testing"

	"github.com/anga/backend/internal/models"
)

// ──────────────────────────────── helpers ────────────────────────────────────

func baseSME() *models.SMEProfile {
	return &models.SMEProfile{
		ID:                "SME-TEST",
		BusinessName:      "Test Co",
		Industry:          models.IndustryRetail,
		EmployeeCount:     10,
		HasInsurance:      false,
		InsuranceCovers:   []string{},
		EmergencyMeasures: []models.EmergencyMeasure{},
		CriticalAssets:    []models.CriticalAsset{},
	}
}

func assessor() *SMEAssessor { return NewSMEAssessor() }

// ──────────────────────────────── preparedness score ─────────────────────────

func TestPreparednessScore_NoMeasures(t *testing.T) {
	sme := baseSME()
	score := assessor().preparednessScore(sme)
	if score != 0 {
		t.Errorf("expected 0 with no measures, got %f", score)
	}
}

func TestPreparednessScore_WithInsurance(t *testing.T) {
	sme := baseSME()
	sme.HasInsurance = true
	sme.InsuranceCovers = []string{"flood", "drought"}
	score := assessor().preparednessScore(sme)
	// 14 (insurance) + 3 + 3 (two perils) = 20
	if score != 20 {
		t.Errorf("expected 20, got %f", score)
	}
}

func TestPreparednessScore_AllMeasures(t *testing.T) {
	sme := baseSME()
	sme.HasInsurance = true
	sme.InsuranceCovers = []string{"flood", "storm", "drought"}
	sme.EmergencyMeasures = []models.EmergencyMeasure{
		models.MeasureEvacuationPlan,
		models.MeasureFloodBarriers,
		models.MeasureBackupPower,
		models.MeasureWaterStorage,
		models.MeasureInsurance,
		models.MeasureEarlyWarning,
		models.MeasureStaffTraining,
		models.MeasureDataBackup,
		models.MeasureSupplyChainBackup,
		models.MeasureFireSuppression,
	}
	sme.CriticalAssets = []models.CriticalAsset{{Name: "Server", Type: "data", IsInsured: true}}
	score := assessor().preparednessScore(sme)
	// Should be clamped at 100
	if score > 100 {
		t.Errorf("score should not exceed 100, got %f", score)
	}
	if score < 80 {
		t.Errorf("fully-prepared SME expected high score, got %f", score)
	}
}

func TestPreparednessScore_Clamped(t *testing.T) {
	sme := baseSME()
	sme.HasInsurance = true
	sme.InsuranceCovers = make([]string, 20) // 20 perils
	sme.EmergencyMeasures = []models.EmergencyMeasure{
		models.MeasureEvacuationPlan, models.MeasureFloodBarriers,
		models.MeasureBackupPower, models.MeasureWaterStorage,
		models.MeasureInsurance, models.MeasureEarlyWarning,
		models.MeasureStaffTraining, models.MeasureDataBackup,
		models.MeasureSupplyChainBackup, models.MeasureFireSuppression,
	}
	score := assessor().preparednessScore(sme)
	if score > 100 {
		t.Errorf("score must be clamped to 100, got %f", score)
	}
}

// ──────────────────────────────── grading ────────────────────────────────────

func TestGradeFromScore(t *testing.T) {
	tests := []struct {
		score float64
		want  models.PreparednessGrade
	}{
		{100, models.GradeA},
		{90, models.GradeA},
		{89, models.GradeB},
		{75, models.GradeB},
		{74, models.GradeC},
		{60, models.GradeC},
		{59, models.GradeD},
		{45, models.GradeD},
		{44, models.GradeE},
		{30, models.GradeE},
		{29, models.GradeF},
		{0, models.GradeF},
	}
	for _, tc := range tests {
		if got := gradeFromScore(tc.score); got != tc.want {
			t.Errorf("gradeFromScore(%.0f) = %q, want %q", tc.score, got, tc.want)
		}
	}
}

// ──────────────────────────────── industry benchmarks ────────────────────────

func TestIndustryBenchmark_Present(t *testing.T) {
	sme := baseSME()
	sme.Industry = models.IndustryAgriculture
	result := assessor().Assess(sme)
	if result.IndustryBenchmark != 38 {
		t.Errorf("agriculture benchmark should be 38, got %f", result.IndustryBenchmark)
	}
}

func TestIndustryBenchmark_Unknown(t *testing.T) {
	sme := baseSME()
	sme.Industry = models.IndustryOther
	result := assessor().Assess(sme)
	if result.IndustryBenchmark == 0 {
		t.Error("benchmark should not be 0 for unknown industry")
	}
}

// ──────────────────────────────── vulnerability factors ──────────────────────

func TestBuildFactors_Count(t *testing.T) {
	sme := baseSME()
	factors := assessor().buildFactors(sme)
	if len(factors) != 5 {
		t.Errorf("expected 5 factors, got %d", len(factors))
	}
}

func TestBuildFactors_WeightsSumToOne(t *testing.T) {
	sme := baseSME()
	factors := assessor().buildFactors(sme)
	total := 0.0
	for _, f := range factors {
		total += f.Weight
	}
	if total < 0.99 || total > 1.01 {
		t.Errorf("factor weights should sum to 1.0, got %f", total)
	}
}

func TestInsuranceRiskScore_NoInsurance(t *testing.T) {
	sme := baseSME()
	score := insuranceRiskScore(sme)
	if score != 80 {
		t.Errorf("no insurance should score 80, got %f", score)
	}
}

func TestInsuranceRiskScore_WithPerils(t *testing.T) {
	sme := baseSME()
	sme.HasInsurance = true
	sme.InsuranceCovers = []string{"flood", "drought", "storm", "fire", "heatwave"}
	score := insuranceRiskScore(sme)
	// 40 - 5*8 = -0 → clamped to 5
	if score != 5 {
		t.Errorf("full coverage should score 5 (min), got %f", score)
	}
}

func TestSizeRiskScore(t *testing.T) {
	tests := []struct {
		employees int
		wantMax   float64
	}{
		{3, 85},
		{15, 70},
		{30, 55},
		{75, 40},
		{200, 25},
		{500, 15},
	}
	for _, tc := range tests {
		got := sizeRiskScore(tc.employees)
		if got != tc.wantMax {
			t.Errorf("sizeRiskScore(%d) = %f, want %f", tc.employees, got, tc.wantMax)
		}
	}
}

// ──────────────────────────────── top risks ──────────────────────────────────

func TestTopRisks_ReturnN(t *testing.T) {
	factors := []models.VulnerabilityFactor{
		{Name: "A", Score: 10},
		{Name: "B", Score: 90},
		{Name: "C", Score: 50},
		{Name: "D", Score: 70},
		{Name: "E", Score: 30},
	}
	risks := topRisks(factors, 3)
	if len(risks) != 3 {
		t.Fatalf("expected 3 top risks, got %d", len(risks))
	}
	if risks[0] != "B" {
		t.Errorf("highest risk should be B, got %s", risks[0])
	}
}

// ──────────────────────────────── action plan ────────────────────────────────

func TestActionPlan_NoInsurance_HasImmediateTask(t *testing.T) {
	sme := baseSME()
	plan := assessor().GenerateActionPlan(sme)
	hasInsuranceTask := false
	for _, task := range plan.Tasks {
		if task.Priority == models.PriorityImmediate && task.Hazard == "all" {
			hasInsuranceTask = true
		}
	}
	if !hasInsuranceTask {
		t.Error("SME with no insurance should get an immediate insurance task")
	}
}

func TestActionPlan_NoEvacuationPlan_HasTask(t *testing.T) {
	sme := baseSME()
	plan := assessor().GenerateActionPlan(sme)
	found := false
	for _, task := range plan.Tasks {
		if task.Priority == models.PriorityImmediate && task.Hazard == "flood,storm" {
			found = true
		}
	}
	if !found {
		t.Error("missing evacuation plan task")
	}
}

func TestActionPlan_AlwaysHasLongTermTask(t *testing.T) {
	sme := baseSME()
	plan := assessor().GenerateActionPlan(sme)
	found := false
	for _, task := range plan.Tasks {
		if task.Priority == models.PriorityLongTerm {
			found = true
		}
	}
	if !found {
		t.Error("action plan should always include a long-term review task")
	}
}

func TestActionPlan_ImmediateCountMatches(t *testing.T) {
	sme := baseSME()
	plan := assessor().GenerateActionPlan(sme)
	count := 0
	for _, task := range plan.Tasks {
		if task.Priority == models.PriorityImmediate {
			count++
		}
	}
	if plan.ImmediateCount != count {
		t.Errorf("ImmediateCount %d does not match actual %d", plan.ImmediateCount, count)
	}
}

func TestActionPlan_TotalTasksMatches(t *testing.T) {
	sme := baseSME()
	plan := assessor().GenerateActionPlan(sme)
	if plan.TotalTasks != len(plan.Tasks) {
		t.Errorf("TotalTasks %d does not match len(Tasks) %d", plan.TotalTasks, len(plan.Tasks))
	}
}

func TestActionPlan_WellPreparedSME_FewerTasks(t *testing.T) {
	sparse := baseSME()
	full := baseSME()
	full.HasInsurance = true
	full.InsuranceCovers = []string{"flood", "drought", "storm"}
	full.EmergencyMeasures = []models.EmergencyMeasure{
		models.MeasureEvacuationPlan,
		models.MeasureEarlyWarning,
		models.MeasureBackupPower,
		models.MeasureStaffTraining,
		models.MeasureDataBackup,
	}

	sparsePlan := assessor().GenerateActionPlan(sparse)
	fullPlan := assessor().GenerateActionPlan(full)

	if fullPlan.TotalTasks >= sparsePlan.TotalTasks {
		t.Errorf("well-prepared SME should have fewer tasks (%d) than unprepared (%d)",
			fullPlan.TotalTasks, sparsePlan.TotalTasks)
	}
}

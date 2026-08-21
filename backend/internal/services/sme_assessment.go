package services

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/anga/backend/internal/models"
)

// SMEAssessor scores SME vulnerability and generates action plans.
type SMEAssessor struct{}

func NewSMEAssessor() *SMEAssessor { return &SMEAssessor{} }

// ──────────────────────────────── industry benchmarks ────────────────────────

// industryBenchmarks is the average preparedness score (0–100) per industry,
// derived from sector resilience studies. Higher = better prepared on average.
var industryBenchmarks = map[models.Industry]float64{
	models.IndustryAgriculture:   38,
	models.IndustryManufacturing: 52,
	models.IndustryRetail:        45,
	models.IndustryHealthcare:    65,
	models.IndustryConstruction:  41,
	models.IndustryLogistics:     55,
	models.IndustryHospitality:   43,
	models.IndustryTechnology:    60,
	models.IndustryFinance:       62,
	models.IndustryOther:         44,
}

// industryBaseVulnerability is the inherent climate exposure score (0–100) for
// each sector regardless of the SME's own measures.
var industryBaseVulnerability = map[models.Industry]float64{
	models.IndustryAgriculture:   82, // highly exposed to all climate hazards
	models.IndustryManufacturing: 65,
	models.IndustryRetail:        50,
	models.IndustryHealthcare:    55,
	models.IndustryConstruction:  70,
	models.IndustryLogistics:     60,
	models.IndustryHospitality:   48,
	models.IndustryTechnology:    35,
	models.IndustryFinance:       30,
	models.IndustryOther:         50,
}

// ──────────────────────────────── measure weights ────────────────────────────

// measurePreparednessPoints is how many preparedness points each measure adds.
var measurePreparednessPoints = map[models.EmergencyMeasure]float64{
	models.MeasureEvacuationPlan:    12,
	models.MeasureFloodBarriers:     10,
	models.MeasureBackupPower:       10,
	models.MeasureWaterStorage:      8,
	models.MeasureInsurance:         14,
	models.MeasureEarlyWarning:      12,
	models.MeasureStaffTraining:     8,
	models.MeasureDataBackup:        6,
	models.MeasureSupplyChainBackup: 8,
	models.MeasureFireSuppression:   6,
}

// ──────────────────────────────── scoring ────────────────────────────────────

// Assess computes the full vulnerability and preparedness assessment for an SME.
func (a *SMEAssessor) Assess(sme *models.SMEProfile) *models.SMEAssessment {
	factors := a.buildFactors(sme)
	vulnerabilityScore := a.weightedVulnerability(factors)
	preparednessScore := a.preparednessScore(sme)
	benchmark := industryBenchmarks[sme.Industry]
	if benchmark == 0 {
		benchmark = industryBenchmarks[models.IndustryOther]
	}

	return &models.SMEAssessment{
		SMEID:              sme.ID,
		BusinessName:       sme.BusinessName,
		Industry:           sme.Industry,
		AssessedAt:         time.Now().UTC(),
		VulnerabilityScore: round(vulnerabilityScore),
		PreparednessScore:  round(preparednessScore),
		PreparednessGrade:  gradeFromScore(preparednessScore),
		IndustryBenchmark:  benchmark,
		BenchmarkDelta:     round(preparednessScore - benchmark),
		Factors:            factors,
		TopRisks:           topRisks(factors, 3),
		Summary:            buildSummary(sme, preparednessScore, benchmark),
	}
}

// buildFactors constructs the weighted vulnerability factor list.
func (a *SMEAssessor) buildFactors(sme *models.SMEProfile) []models.VulnerabilityFactor {
	return []models.VulnerabilityFactor{
		{
			Name:        "Industry Risk Category",
			Score:       industryRiskScore(sme.Industry),
			Weight:      0.25,
			Description: fmt.Sprintf("Inherent climate exposure for the %s sector", sme.Industry),
		},
		{
			Name:        "Insurance Coverage",
			Score:       insuranceRiskScore(sme),
			Weight:      0.20,
			Description: insuranceSummary(sme),
		},
		{
			Name:        "Emergency Measures",
			Score:       emergencyMeasuresRiskScore(sme),
			Weight:      0.25,
			Description: fmt.Sprintf("%d of 10 key measures in place", len(sme.EmergencyMeasures)),
		},
		{
			Name:        "Critical Asset Exposure",
			Score:       assetExposureScore(sme),
			Weight:      0.15,
			Description: assetExposureSummary(sme),
		},
		{
			Name:        "Business Size",
			Score:       sizeRiskScore(sme.EmployeeCount),
			Weight:      0.15,
			Description: sizeDescription(sme.EmployeeCount),
		},
	}
}

// weightedVulnerability computes the composite vulnerability score from factors.
func (a *SMEAssessor) weightedVulnerability(factors []models.VulnerabilityFactor) float64 {
	total := 0.0
	for _, f := range factors {
		total += f.Score * f.Weight
	}
	return clampF(total, 0, 100)
}

// preparednessScore is the inverse of vulnerability adjusted for actual measures.
func (a *SMEAssessor) preparednessScore(sme *models.SMEProfile) float64 {
	// Start from 0 and add points for each measure in place
	score := 0.0
	for _, m := range sme.EmergencyMeasures {
		score += measurePreparednessPoints[m]
	}
	// Insurance adds directly
	if sme.HasInsurance {
		score += 14
		for _, cover := range sme.InsuranceCovers {
			_ = cover
			score += 3 // each named peril adds 3 points
		}
	}
	// Having documented critical assets shows awareness
	if len(sme.CriticalAssets) > 0 {
		score += 5
	}
	return clampF(score, 0, 100)
}

// ──────────────────────────────── factor scorers ─────────────────────────────

func industryRiskScore(ind models.Industry) float64 {
	if v, ok := industryBaseVulnerability[ind]; ok {
		return v
	}
	return industryBaseVulnerability[models.IndustryOther]
}

func insuranceRiskScore(sme *models.SMEProfile) float64 {
	if !sme.HasInsurance {
		return 80 // no insurance = high financial vulnerability
	}
	// Reduce risk for each named peril covered
	base := 40.0
	base -= float64(len(sme.InsuranceCovers)) * 8
	return clampF(base, 5, 40)
}

func insuranceSummary(sme *models.SMEProfile) string {
	if !sme.HasInsurance {
		return "No climate insurance coverage detected"
	}
	if len(sme.InsuranceCovers) == 0 {
		return "Insurance held but no specific climate perils declared"
	}
	return fmt.Sprintf("Covers: %s", strings.Join(sme.InsuranceCovers, ", "))
}

func emergencyMeasuresRiskScore(sme *models.SMEProfile) float64 {
	// 0 measures = 100 risk; 10 measures = 0 risk (linear)
	count := float64(len(sme.EmergencyMeasures))
	return clampF(100-(count/10)*100, 0, 100)
}

func assetExposureScore(sme *models.SMEProfile) float64 {
	if len(sme.CriticalAssets) == 0 {
		return 60 // unknown exposure is treated as moderate-high
	}
	uninsured := 0
	for _, a := range sme.CriticalAssets {
		if !a.IsInsured {
			uninsured++
		}
	}
	ratio := float64(uninsured) / float64(len(sme.CriticalAssets))
	return clampF(ratio*100, 0, 100)
}

func assetExposureSummary(sme *models.SMEProfile) string {
	if len(sme.CriticalAssets) == 0 {
		return "No critical assets declared"
	}
	uninsured := 0
	for _, a := range sme.CriticalAssets {
		if !a.IsInsured {
			uninsured++
		}
	}
	return fmt.Sprintf("%d assets declared, %d uninsured", len(sme.CriticalAssets), uninsured)
}

func sizeRiskScore(employees int) float64 {
	// Smaller firms have less capacity to absorb climate shocks
	switch {
	case employees <= 5:
		return 85
	case employees <= 20:
		return 70
	case employees <= 50:
		return 55
	case employees <= 100:
		return 40
	case employees <= 250:
		return 25
	default:
		return 15
	}
}

func sizeDescription(employees int) string {
	switch {
	case employees <= 5:
		return "Micro-enterprise (≤5 staff): limited resilience capacity"
	case employees <= 20:
		return "Small business (6–20 staff): moderate resilience capacity"
	case employees <= 50:
		return "Small-medium (21–50 staff)"
	case employees <= 250:
		return "Medium enterprise (51–250 staff): good resilience capacity"
	default:
		return "Large enterprise (250+ staff): high resilience capacity"
	}
}

// ──────────────────────────────── grading ────────────────────────────────────

func gradeFromScore(score float64) models.PreparednessGrade {
	switch {
	case score >= 90:
		return models.GradeA
	case score >= 75:
		return models.GradeB
	case score >= 60:
		return models.GradeC
	case score >= 45:
		return models.GradeD
	case score >= 30:
		return models.GradeE
	default:
		return models.GradeF
	}
}

// topRisks returns the names of the n highest-scoring vulnerability factors.
func topRisks(factors []models.VulnerabilityFactor, n int) []string {
	// Simple selection sort for the small slice
	sorted := make([]models.VulnerabilityFactor, len(factors))
	copy(sorted, factors)
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].Score > sorted[i].Score {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	names := []string{}
	for i := 0; i < n && i < len(sorted); i++ {
		names = append(names, sorted[i].Name)
	}
	return names
}

func buildSummary(sme *models.SMEProfile, prep, benchmark float64) string {
	grade := gradeFromScore(prep)
	diff := prep - benchmark
	direction := "above"
	if diff < 0 {
		direction = "below"
		diff = -diff
	}
	return fmt.Sprintf(
		"%s (%s sector) scores %s for climate preparedness — %.0f points %.0f %s the %s industry benchmark.",
		sme.BusinessName, sme.Industry, grade, prep, diff, direction, sme.Industry,
	)
}

// ──────────────────────────────── action plan ────────────────────────────────

// GenerateActionPlan produces a prioritised set of preparedness tasks for an SME.
func (a *SMEAssessor) GenerateActionPlan(sme *models.SMEProfile) *models.SMEActionPlan {
	tasks := a.buildTasks(sme)
	immediate := 0
	for _, t := range tasks {
		if t.Priority == models.PriorityImmediate {
			immediate++
		}
	}
	return &models.SMEActionPlan{
		SMEID:          sme.ID,
		BusinessName:   sme.BusinessName,
		GeneratedAt:    time.Now().UTC(),
		TotalTasks:     len(tasks),
		ImmediateCount: immediate,
		Tasks:          tasks,
	}
}

// buildTasks generates recommended actions based on gaps in the SME profile.
func (a *SMEAssessor) buildTasks(sme *models.SMEProfile) []models.ActionTask {
	tasks := []models.ActionTask{}
	seq := 1

	hasMeasure := func(m models.EmergencyMeasure) bool {
		for _, em := range sme.EmergencyMeasures {
			if em == m {
				return true
			}
		}
		return false
	}

	add := func(title, desc, hazard, cost string, priority models.ActionPriority) {
		tasks = append(tasks, models.ActionTask{
			ID:            fmt.Sprintf("TASK-%03d", seq),
			Title:         title,
			Description:   desc,
			Priority:      priority,
			Hazard:        hazard,
			EstimatedCost: cost,
		})
		seq++
	}

	// ── Insurance gap ─────────────────────────────────────────────────────────
	if !sme.HasInsurance {
		add(
			"Obtain Climate Risk Insurance",
			"Source a policy covering flood, drought, and storm damage. Uninsured businesses face full loss exposure.",
			"all",
			"$500–$3,000/year",
			models.PriorityImmediate,
		)
	} else if len(sme.InsuranceCovers) == 0 {
		add(
			"Declare Specific Climate Perils to Insurer",
			"Contact your insurer to explicitly list flood, drought, heatwave, and storm as covered perils.",
			"all",
			"No additional cost",
			models.PriorityImmediate,
		)
	}

	// ── Evacuation plan ───────────────────────────────────────────────────────
	if !hasMeasure(models.MeasureEvacuationPlan) {
		add(
			"Develop Staff Evacuation & Continuity Plan",
			"Document evacuation routes, assembly points, and a 72-hour business continuity procedure.",
			"flood,storm",
			"$0–$500 (internal resource)",
			models.PriorityImmediate,
		)
	}

	// ── Early warning ─────────────────────────────────────────────────────────
	if !hasMeasure(models.MeasureEarlyWarning) {
		add(
			"Subscribe to Early Warning Alerts",
			"Register with national meteorological alert services and this platform's webhook notifications.",
			"all",
			"Free–$200/year",
			models.PriorityImmediate,
		)
	}

	// ── Backup power ─────────────────────────────────────────────────────────
	if !hasMeasure(models.MeasureBackupPower) {
		add(
			"Install Backup Power Supply",
			"A UPS or generator ensures operations continue during grid outages caused by storms or heatwaves.",
			"storm,heatwave",
			"$800–$5,000",
			models.PriorityShortTerm,
		)
	}

	// ── Flood barriers (high-risk industries) ────────────────────────────────
	highFloodRisk := map[models.Industry]bool{
		models.IndustryAgriculture:   true,
		models.IndustryManufacturing: true,
		models.IndustryConstruction:  true,
		models.IndustryLogistics:     true,
	}
	if highFloodRisk[sme.Industry] && !hasMeasure(models.MeasureFloodBarriers) {
		add(
			"Install Flood Barriers / Berms",
			"Physical flood defences around premises reduce inundation risk for flood-exposed industries.",
			"flood",
			"$1,000–$15,000",
			models.PriorityShortTerm,
		)
	}

	// ── Water storage (agriculture / hospitality) ─────────────────────────────
	droughtRisk := map[models.Industry]bool{
		models.IndustryAgriculture: true,
		models.IndustryHospitality: true,
	}
	if droughtRisk[sme.Industry] && !hasMeasure(models.MeasureWaterStorage) {
		add(
			"Install Rainwater Harvesting / Water Storage",
			"Rainwater tanks or underground cisterns maintain water supply during drought periods.",
			"drought",
			"$500–$8,000",
			models.PriorityShortTerm,
		)
	}

	// ── Staff training ───────────────────────────────────────────────────────
	if !hasMeasure(models.MeasureStaffTraining) {
		add(
			"Conduct Climate Emergency Staff Training",
			"Annual training on climate hazard response, evacuation drills, and first aid increases survival and recovery speed.",
			"all",
			"$100–$1,000",
			models.PriorityShortTerm,
		)
	}

	// ── Data backup ───────────────────────────────────────────────────────────
	if !hasMeasure(models.MeasureDataBackup) {
		add(
			"Implement Offsite / Cloud Data Backup",
			"Critical business data should be replicated offsite to survive flooding, fire, or power loss.",
			"flood,storm",
			"$0–$300/year",
			models.PriorityShortTerm,
		)
	}

	// ── Supply chain ─────────────────────────────────────────────────────────
	supplyChainCritical := map[models.Industry]bool{
		models.IndustryManufacturing: true,
		models.IndustryLogistics:     true,
		models.IndustryRetail:        true,
	}
	if supplyChainCritical[sme.Industry] && !hasMeasure(models.MeasureSupplyChainBackup) {
		add(
			"Diversify Supply Chain & Identify Backup Suppliers",
			"Single-source supply chains are highly vulnerable to climate disruptions. Map and pre-qualify at least two alternatives for critical inputs.",
			"all",
			"Internal resource",
			models.PriorityMediumTerm,
		)
	}

	// ── Asset documentation ───────────────────────────────────────────────────
	if len(sme.CriticalAssets) == 0 {
		add(
			"Document and Value Critical Business Assets",
			"Create an inventory of critical assets with replacement values. This is prerequisite for insurance claims and recovery planning.",
			"all",
			"$0 (internal)",
			models.PriorityMediumTerm,
		)
	} else {
		// Check for uninsured high-value assets
		for _, asset := range sme.CriticalAssets {
			if !asset.IsInsured && asset.EstimatedValue > 5000 {
				add(
					fmt.Sprintf("Insure Critical Asset: %s", asset.Name),
					fmt.Sprintf("%s (est. $%.0f) is currently uninsured. Add it to your policy as a named asset.", asset.Name, asset.EstimatedValue),
					"all",
					"Varies by insurer",
					models.PriorityMediumTerm,
				)
				break // limit to one per plan to avoid noise
			}
		}
	}

	// ── Long-term structural ─────────────────────────────────────────────────
	add(
		"Conduct Annual Climate Risk Review",
		"Schedule a yearly review of this action plan against updated climate projections and business changes.",
		"all",
		"$0–$2,000",
		models.PriorityLongTerm,
	)

	return tasks
}

// ──────────────────────────────── helpers ────────────────────────────────────

func clampF(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func round(v float64) float64 {
	return math.Round(v*100) / 100
}

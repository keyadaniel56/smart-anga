package services

import (
	"fmt"
	"math"
	"testing"
)

// ──────────────────────────── composite score / weights ───────────────────────

func TestCompositeScore_ZeroHazards(t *testing.T) {
	h := HazardSummary{}
	if got := compositeScore(h); got != 0 {
		t.Fatalf("expected 0, got %f", got)
	}
}

func TestCompositeScore_MaxHazards(t *testing.T) {
	h := HazardSummary{Flood: 100, Drought: 100, Heatwave: 100, Storm: 100}
	got := compositeScore(h)
	if math.Abs(got-100) > 0.01 {
		t.Fatalf("expected 100, got %f", got)
	}
}

func TestCompositeScore_Weights(t *testing.T) {
	// Flood only = 100 → 100*0.30 = 30
	if got := compositeScore(HazardSummary{Flood: 100}); math.Abs(got-30) > 0.01 {
		t.Errorf("flood-only weight: want 30, got %f", got)
	}
	// Drought only = 100 → 100*0.25 = 25
	if got := compositeScore(HazardSummary{Drought: 100}); math.Abs(got-25) > 0.01 {
		t.Errorf("drought-only weight: want 25, got %f", got)
	}
	// Heatwave only = 100 → 100*0.25 = 25
	if got := compositeScore(HazardSummary{Heatwave: 100}); math.Abs(got-25) > 0.01 {
		t.Errorf("heatwave-only weight: want 25, got %f", got)
	}
	// Storm only = 100 → 100*0.20 = 20
	if got := compositeScore(HazardSummary{Storm: 100}); math.Abs(got-20) > 0.01 {
		t.Errorf("storm-only weight: want 20, got %f", got)
	}
}

func TestCompositeScore_Clamp(t *testing.T) {
	// Verify clamp to 100
	h := HazardSummary{Flood: 100, Drought: 100, Heatwave: 100, Storm: 100}
	if got := compositeScore(h); got > 100 {
		t.Errorf("composite should not exceed 100, got %f", got)
	}
}

// ──────────────────────────── risk classification ─────────────────────────────

func TestClassifyRisk(t *testing.T) {
	tests := []struct {
		score float64
		want  RiskLevel
	}{
		{0, RiskLow},
		{20, RiskLow},
		{21, RiskModerate},
		{40, RiskModerate},
		{41, RiskHigh},
		{60, RiskHigh},
		{61, RiskVeryHigh},
		{80, RiskVeryHigh},
		{81, RiskExtreme},
		{100, RiskExtreme},
	}
	for _, tc := range tests {
		if got := classifyRisk(tc.score); got != tc.want {
			t.Errorf("classifyRisk(%.0f) = %q, want %q", tc.score, got, tc.want)
		}
	}
}

// ──────────────────────────── alert counting ──────────────────────────────────

func TestCountAlerts(t *testing.T) {
	tests := []struct {
		h    HazardSummary
		want int
	}{
		{HazardSummary{}, 0},
		{HazardSummary{Flood: 50}, 1},
		{HazardSummary{Flood: 49.9}, 0},
		{HazardSummary{Flood: 60, Drought: 70, Heatwave: 30, Storm: 80}, 3},
		{HazardSummary{Flood: 100, Drought: 100, Heatwave: 100, Storm: 100}, 4},
	}
	for _, tc := range tests {
		if got := countAlerts(tc.h); got != tc.want {
			t.Errorf("countAlerts(%+v) = %d, want %d", tc.h, got, tc.want)
		}
	}
}

// ──────────────────────────── river discharge ──────────────────────────────────

func TestClassifyRiverDischarge_Nil(t *testing.T) {
	if got := classifyRiverDischarge(nil); got != "unknown" {
		t.Fatalf("expected unknown, got %s", got)
	}
}

func TestClassifyRiverDischarge_Levels(t *testing.T) {
	makeFL := func(discharge float64, means []float64) *floodResponse {
		fl := &floodResponse{}
		fl.Daily.RiverDischarge = []float64{discharge}
		fl.Daily.RiverDischargeMean = means
		return fl
	}
	tests := []struct {
		discharge float64
		means     []float64
		want      string
	}{
		{200, []float64{100}, "critical"},
		{160, []float64{100}, "high"},
		{125, []float64{100}, "elevated"},
		{90, []float64{100}, "normal"},
		{70, []float64{100}, "low"},
	}
	for _, tc := range tests {
		fl := makeFL(tc.discharge, tc.means)
		if got := classifyRiverDischarge(fl); got != tc.want {
			t.Errorf("discharge=%.0f → got %q, want %q", tc.discharge, got, tc.want)
		}
	}
}

// ──────────────────────────── math helpers ────────────────────────────────────

func TestClamp(t *testing.T) {
	if clamp(-5, 0, 100) != 0 {
		t.Error("below min")
	}
	if clamp(150, 0, 100) != 100 {
		t.Error("above max")
	}
	if clamp(50, 0, 100) != 50 {
		t.Error("in range")
	}
}

func TestAvgFloat64(t *testing.T) {
	if avgFloat64(nil) != 0 {
		t.Error("nil should be 0")
	}
	if avgFloat64([]float64{2, 4, 6}) != 4 {
		t.Error("[2,4,6] avg should be 4")
	}
}

func TestHaversineKm(t *testing.T) {
	// London → Paris ≈ 341 km
	dist := haversineKm(51.5074, -0.1278, 48.8566, 2.3522)
	if dist < 330 || dist > 360 {
		t.Errorf("London→Paris unexpected: %f km", dist)
	}
}

// ──────────────────────────── asset scoring ───────────────────────────────────

func TestPerAssetHazard_Bridge(t *testing.T) {
	h := HazardSummary{Flood: 80}
	// bridge flood weight = 0.9 → 80*0.9 = 72
	got := perAssetHazard("bridge", "flood", h)
	if math.Abs(got-72) > 0.01 {
		t.Errorf("bridge flood: want 72, got %f", got)
	}
}

func TestPerAssetHazard_Farm_Drought(t *testing.T) {
	h := HazardSummary{Drought: 60}
	// farm drought weight = 0.9 → 60*0.9 = 54
	got := perAssetHazard("farm", "drought", h)
	if math.Abs(got-54) > 0.01 {
		t.Errorf("farm drought: want 54, got %f", got)
	}
}

func TestDominantHazard(t *testing.T) {
	if got := dominantHazard(20, 80, 30, 10); got != "drought" {
		t.Errorf("expected drought, got %s", got)
	}
	if got := dominantHazard(90, 10, 10, 10); got != "flood" {
		t.Errorf("expected flood, got %s", got)
	}
}

// ──────────────────────────── trend builder ───────────────────────────────────

func TestBuildTrendPoints_Empty(t *testing.T) {
	pts := buildTrendPoints(nil, 7)
	if len(pts) != 0 {
		t.Error("expected empty for nil archive")
	}
}

func TestBuildTrendPoints_DailyFields(t *testing.T) {
	ar := &archiveResponse{}
	for i := 0; i < 3; i++ {
		ar.Daily.Time = append(ar.Daily.Time, fmt.Sprintf("2026-08-%02d", i+1))
		ar.Daily.TempMax = append(ar.Daily.TempMax, 28.0)
		ar.Daily.TempMin = append(ar.Daily.TempMin, 18.0)
		ar.Daily.PrecipSum = append(ar.Daily.PrecipSum, 5.0)
		ar.Daily.SoilMoisture = append(ar.Daily.SoilMoisture, 0.3)
		ar.Daily.WindSpeedMax = append(ar.Daily.WindSpeedMax, 10.0)
		ar.Daily.Et0 = append(ar.Daily.Et0, 3.5)
		ar.Daily.WeatherCode = append(ar.Daily.WeatherCode, 61)
	}
	pts := buildTrendPoints(ar, 30)
	if len(pts) != 3 {
		t.Fatalf("expected 3 points, got %d", len(pts))
	}
	p := pts[0]
	if p.Date != "2026-08-01" {
		t.Errorf("unexpected date: %s", p.Date)
	}
	// avgTemp = (28+18)/2 = 23
	if math.Abs(p.Temperature-23) > 0.01 {
		t.Errorf("temperature: want 23, got %f", p.Temperature)
	}
	if p.WeatherCode != 61 {
		t.Errorf("weather code: want 61, got %d", p.WeatherCode)
	}
	if p.Et0 != 3.5 {
		t.Errorf("et0: want 3.5, got %f", p.Et0)
	}
}

func TestBuildTrendPoints_Trim(t *testing.T) {
	ar := &archiveResponse{}
	for i := 0; i < 10; i++ {
		ar.Daily.Time = append(ar.Daily.Time, fmt.Sprintf("2026-07-%02d", i+1))
	}
	pts := buildTrendPoints(ar, 5)
	if len(pts) != 5 {
		t.Errorf("expected 5 trimmed points, got %d", len(pts))
	}
}

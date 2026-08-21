package services

import (
	"math"
	"testing"
)

// ──────────────────────────────── helpers ────────────────────────────────────

func makeForecast(soilVal float64, precipVals []float64) *droughtForecastResp {
	fc := &droughtForecastResp{}
	// Fill 14 days * 24 hours of constant soil moisture across all layers
	n := 14 * 24
	for i := 0; i < n; i++ {
		fc.Hourly.SoilMoisture0 = append(fc.Hourly.SoilMoisture0, soilVal)
		fc.Hourly.SoilMoisture1 = append(fc.Hourly.SoilMoisture1, soilVal)
		fc.Hourly.SoilMoisture3 = append(fc.Hourly.SoilMoisture3, soilVal)
		fc.Hourly.SoilMoisture9 = append(fc.Hourly.SoilMoisture9, soilVal)
		if i < len(precipVals) {
			fc.Hourly.Precipitation = append(fc.Hourly.Precipitation, precipVals[i])
		} else {
			fc.Hourly.Precipitation = append(fc.Hourly.Precipitation, 0)
		}
	}
	return fc
}

func makeArchive(dailyPrecip []float64) *droughtArchiveResp {
	ar := &droughtArchiveResp{}
	for i, p := range dailyPrecip {
		ar.Daily.Time = append(ar.Daily.Time, "2026-01-01") // date value irrelevant here
		_ = i
		ar.Daily.PrecipSum = append(ar.Daily.PrecipSum, p)
		ar.Daily.SoilMoist = append(ar.Daily.SoilMoist, 0.3)
	}
	return ar
}

// ──────────────────────────────── risk score ─────────────────────────────────

func TestCompute_DryConditions_HighScore(t *testing.T) {
	d := &DroughtAssessor{}
	fc := makeForecast(0.05, nil) // very dry soil
	ar := makeArchive(make([]float64, 90)) // zero rain for 90 days

	result := d.compute(fc, ar)
	if result.DroughtRiskScore < 50 {
		t.Errorf("dry conditions should produce score >=50, got %f", result.DroughtRiskScore)
	}
}

func TestCompute_WetConditions_LowScore(t *testing.T) {
	d := &DroughtAssessor{}
	fc := makeForecast(0.45, nil) // high soil moisture

	// 90 days of 5mm/day rain
	daily := make([]float64, 90)
	for i := range daily {
		daily[i] = 5.0
	}
	ar := makeArchive(daily)

	result := d.compute(fc, ar)
	if result.DroughtRiskScore > 40 {
		t.Errorf("wet conditions should produce score <=40, got %f", result.DroughtRiskScore)
	}
}

func TestCompute_RiskScoreClamped(t *testing.T) {
	d := &DroughtAssessor{}
	fc := makeForecast(0.0, nil)
	ar := makeArchive(make([]float64, 90))

	result := d.compute(fc, ar)
	if result.DroughtRiskScore > 100 || result.DroughtRiskScore < 0 {
		t.Errorf("risk score out of range: %f", result.DroughtRiskScore)
	}
}

// ──────────────────────────────── severity ───────────────────────────────────

func TestClassifyDrought(t *testing.T) {
	tests := []struct {
		score float64
		want  DroughtSeverity
	}{
		{0, SeverityNone},
		{19, SeverityNone},
		{20, SeverityWatch},
		{44, SeverityWatch},
		{45, SeverityWarning},
		{69, SeverityWarning},
		{70, SeverityEmergency},
		{100, SeverityEmergency},
	}
	for _, tc := range tests {
		if got := classifyDrought(tc.score); got != tc.want {
			t.Errorf("classifyDrought(%.0f) = %q, want %q", tc.score, got, tc.want)
		}
	}
}

// ──────────────────────────────── SPI ────────────────────────────────────────

func TestCalcSPI_Normal(t *testing.T) {
	// p30 == mu (75mm) → SPI = 0
	spi := calcSPI(75.0)
	if math.Abs(spi) > 0.01 {
		t.Errorf("SPI for mean precip should be ~0, got %f", spi)
	}
}

func TestCalcSPI_Dry(t *testing.T) {
	spi := calcSPI(0)
	if spi >= 0 {
		t.Errorf("zero precip should give negative SPI, got %f", spi)
	}
}

func TestCalcSPI_Wet(t *testing.T) {
	spi := calcSPI(200)
	if spi <= 0 {
		t.Errorf("high precip should give positive SPI, got %f", spi)
	}
}

func TestSPIClass(t *testing.T) {
	tests := []struct {
		spi  float64
		want string
	}{
		{2.5, "Extremely Wet"},
		{1.6, "Very Wet"},
		{1.1, "Moderately Wet"},
		{0.0, "Near Normal"},
		{-1.2, "Moderately Dry"},
		{-1.7, "Severely Dry"},
		{-2.5, "Extremely Dry"},
	}
	for _, tc := range tests {
		if got := spiClass(tc.spi); got != tc.want {
			t.Errorf("spiClass(%.1f) = %q, want %q", tc.spi, got, tc.want)
		}
	}
}

// ──────────────────────────────── rolling windows ────────────────────────────

func TestCalcWindows_Totals(t *testing.T) {
	// 90 days, each with exactly 1mm
	daily := make([]float64, 90)
	for i := range daily {
		daily[i] = 1.0
	}
	ar := makeArchive(daily)
	w := calcWindows(ar)

	if math.Abs(w.Last30DaysMm-30) > 0.01 {
		t.Errorf("30-day total: want 30, got %f", w.Last30DaysMm)
	}
	if math.Abs(w.Last60DaysMm-60) > 0.01 {
		t.Errorf("60-day total: want 60, got %f", w.Last60DaysMm)
	}
	if math.Abs(w.Last90DaysMm-90) > 0.01 {
		t.Errorf("90-day total: want 90, got %f", w.Last90DaysMm)
	}
}

func TestCalcWindows_DeficitClamped(t *testing.T) {
	// Extremely wet: no deficit
	daily := make([]float64, 90)
	for i := range daily {
		daily[i] = 20.0 // well above normal
	}
	ar := makeArchive(daily)
	w := calcWindows(ar)
	if w.Deficit30DayMm != 0 {
		t.Errorf("no deficit expected for wet period, got %f", w.Deficit30DayMm)
	}
}

func TestCalcWindows_NilArchive(t *testing.T) {
	w := calcWindows(nil)
	if w.Last30DaysMm != 0 || w.Deficit30DayMm != 0 {
		t.Error("nil archive should produce zero windows")
	}
}

// ──────────────────────────────── days since rain ────────────────────────────

func TestDaysSinceLastRain_Consecutive(t *testing.T) {
	daily := []float64{5, 3, 0, 0, 0, 0, 0}
	ar := makeArchive(daily)
	got := daysSinceLastRain(ar)
	if got != 5 {
		t.Errorf("expected 5 dry days, got %d", got)
	}
}

func TestDaysSinceLastRain_RainedToday(t *testing.T) {
	ar := makeArchive([]float64{0, 0, 0, 5.0})
	got := daysSinceLastRain(ar)
	if got != 0 {
		t.Errorf("expected 0 (rained last day), got %d", got)
	}
}

func TestDaysSinceLastRain_Nil(t *testing.T) {
	if got := daysSinceLastRain(nil); got != 0 {
		t.Errorf("expected 0 for nil archive, got %d", got)
	}
}

// ──────────────────────────────── soil layers ────────────────────────────────

func TestExtractSoilLayers_Avg(t *testing.T) {
	fc := makeForecast(0.30, nil)
	layers := extractSoilLayers(fc)
	// All layers filled with 0.30, avg should equal 0.30
	if math.Abs(layers.Depth0to1cm-0.30) > 0.001 {
		t.Errorf("depth0to1cm: want 0.30, got %f", layers.Depth0to1cm)
	}
}

func TestScaleLayers_Percent(t *testing.T) {
	l := SoilLayers{Depth0to1cm: 0.25, Depth1to3cm: 0.40, Depth3to9cm: 0.10, Depth9to27cm: 0.35}
	scaled := scaleLayers(l)
	if math.Abs(scaled.Depth0to1cm-25) > 0.01 {
		t.Errorf("scale depth0to1cm: want 25, got %f", scaled.Depth0to1cm)
	}
}

// ──────────────────────────────── trend ──────────────────────────────────────

func TestSoilMoistureTrend_Improving(t *testing.T) {
	fc := &droughtForecastResp{}
	n := 14 * 24
	for i := 0; i < n; i++ {
		// Soil moisture increases linearly from 0.1 to 0.4
		v := 0.1 + 0.3*float64(i)/float64(n)
		fc.Hourly.SoilMoisture3 = append(fc.Hourly.SoilMoisture3, v)
	}
	if got := soilMoistureTrend(fc); got != TrendImproving {
		t.Errorf("expected improving, got %s", got)
	}
}

func TestSoilMoistureTrend_Worsening(t *testing.T) {
	fc := &droughtForecastResp{}
	n := 14 * 24
	for i := 0; i < n; i++ {
		v := 0.4 - 0.3*float64(i)/float64(n) // decreasing
		fc.Hourly.SoilMoisture3 = append(fc.Hourly.SoilMoisture3, v)
	}
	if got := soilMoistureTrend(fc); got != TrendWorsening {
		t.Errorf("expected worsening, got %s", got)
	}
}

func TestSoilMoistureTrend_TooFewPoints(t *testing.T) {
	fc := makeForecast(0.3, nil)
	fc.Hourly.SoilMoisture3 = fc.Hourly.SoilMoisture3[:10] // not enough data
	if got := soilMoistureTrend(fc); got != TrendStable {
		t.Errorf("too few points should return stable, got %s", got)
	}
}

// ──────────────────────────────── recommendations ────────────────────────────

func TestRecommendations_AlwaysHasMonitoring(t *testing.T) {
	recs := recommendations(10, SoilLayers{}, PrecipWindows{}, 0)
	if len(recs) == 0 || recs[0] == "" {
		t.Error("recommendations should always include at least one entry")
	}
}

func TestRecommendations_EmergencyHasAlertTask(t *testing.T) {
	recs := recommendations(80, SoilLayers{Depth0to1cm: 0.05, Depth3to9cm: 0.05},
		PrecipWindows{Deficit30DayMm: 60, Deficit90DayMm: 150}, 20)
	found := false
	for _, r := range recs {
		if len(r) > 20 { // non-trivial recommendation
			found = true
		}
	}
	if !found {
		t.Error("emergency conditions should produce substantive recommendations")
	}
	if len(recs) < 3 {
		t.Errorf("emergency state should produce >=3 recommendations, got %d", len(recs))
	}
}

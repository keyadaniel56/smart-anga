package services

import (
	"math"
	"testing"
)

// ──────────────────────────────── test helpers ───────────────────────────────

func makeFCFlood(hourlyPrecip []float64, soilVal float64) *floodForecastResp {
	fc := &floodForecastResp{}
	n := 72
	for i := 0; i < n; i++ {
		if i < len(hourlyPrecip) {
			fc.Hourly.Precipitation = append(fc.Hourly.Precipitation, hourlyPrecip[i])
		} else {
			fc.Hourly.Precipitation = append(fc.Hourly.Precipitation, 0)
		}
		fc.Hourly.SoilMoisture = append(fc.Hourly.SoilMoisture, soilVal)
	}
	return fc
}

func makeRiverResp(current, mean, max float64) *floodRiverResp {
	rv := &floodRiverResp{}
	rv.Daily.RiverDischarge = []float64{current}
	rv.Daily.RiverDischargeMean = []float64{mean}
	rv.Daily.RiverDischargeMax = []float64{max}
	rv.Daily.RiverDischargeMin = []float64{current * 0.5}
	return rv
}

func makeArchiveFlood(dailyPrecip []float64) *floodArchiveResp {
	ar := &floodArchiveResp{}
	for _, p := range dailyPrecip {
		ar.Daily.Time = append(ar.Daily.Time, "2026-01-01")
		ar.Daily.PrecipSum = append(ar.Daily.PrecipSum, p)
	}
	return ar
}

// ──────────────────────────────── risk score ─────────────────────────────────

func TestFloodCompute_HighRain_HighScore(t *testing.T) {
	p := &FloodPredictor{}
	// 2mm/h × 72h = 144mm total — well above 120mm threshold
	hourly := make([]float64, 72)
	for i := range hourly {
		hourly[i] = 2.0
	}
	fc := makeFCFlood(hourly, 0.65) // near-saturated soil
	rv := makeRiverResp(300, 100, 400)
	ar := makeArchiveFlood(make([]float64, 90)) // historically dry

	result := p.compute(fc, rv, ar)
	if result.RiskScore < 50 {
		t.Errorf("heavy rain + high discharge should score >=50, got %f", result.RiskScore)
	}
}

func TestFloodCompute_DryConditions_LowScore(t *testing.T) {
	p := &FloodPredictor{}
	fc := makeFCFlood(nil, 0.10) // no rain, dry soil
	rv := makeRiverResp(50, 100, 200) // below median
	daily := make([]float64, 90)
	for i := range daily {
		daily[i] = 3.0 // historical normal
	}
	ar := makeArchiveFlood(daily)

	result := p.compute(fc, rv, ar)
	if result.RiskScore > 30 {
		t.Errorf("dry conditions should score <=30, got %f", result.RiskScore)
	}
}

func TestFloodCompute_RiskScoreBounds(t *testing.T) {
	p := &FloodPredictor{}
	// Extreme: 5mm/h rain, saturated soil, 5× median discharge
	hourly := make([]float64, 72)
	for i := range hourly {
		hourly[i] = 5.0
	}
	fc := makeFCFlood(hourly, 1.0)
	rv := makeRiverResp(500, 100, 600)
	ar := makeArchiveFlood(make([]float64, 90))

	result := p.compute(fc, rv, ar)
	if result.RiskScore < 0 || result.RiskScore > 100 {
		t.Errorf("risk score out of [0,100]: %f", result.RiskScore)
	}
}

// ──────────────────────────────── factor weights ─────────────────────────────

func TestFactorWeightsSumToOne(t *testing.T) {
	p := &FloodPredictor{}
	fc := makeFCFlood(nil, 0.3)
	result := p.compute(fc, nil, nil)
	total := result.Factors.Precipitation.Weight +
		result.Factors.RiverDischarge.Weight +
		result.Factors.SoilMoisture.Weight +
		result.Factors.HistoricalPattern.Weight
	if math.Abs(total-1.0) > 0.001 {
		t.Errorf("factor weights must sum to 1.0, got %f", total)
	}
}

// ──────────────────────────────── precipitation scoring ──────────────────────

func TestScorePrecip_ZeroRain(t *testing.T) {
	f := scorePrecip(PrecipForecast{})
	if f.Score != 0 {
		t.Errorf("zero rain should score 0, got %f", f.Score)
	}
}

func TestScorePrecip_HeavyRain_MaxScore(t *testing.T) {
	f := scorePrecip(PrecipForecast{Next24hMm: 50, Next48hMm: 80, Next72hMm: 150})
	if f.Score < 90 {
		t.Errorf("150mm over 72h should score >=90, got %f", f.Score)
	}
}

func TestScorePrecip_Flash24h_Boost(t *testing.T) {
	// Same 72h total but concentrated in 24h gets a boost
	fNormal := scorePrecip(PrecipForecast{Next24hMm: 5, Next48hMm: 30, Next72hMm: 60})
	fFlash := scorePrecip(PrecipForecast{Next24hMm: 40, Next48hMm: 50, Next72hMm: 60})
	if fFlash.Score <= fNormal.Score {
		t.Errorf("flash flood (heavy 24h rain) should score higher than spread rain: %f vs %f",
			fFlash.Score, fNormal.Score)
	}
}

func TestScorePrecip_Weight(t *testing.T) {
	f := scorePrecip(PrecipForecast{})
	if f.Weight != 0.35 {
		t.Errorf("precip weight should be 0.35, got %f", f.Weight)
	}
}

// ──────────────────────────────── river discharge scoring ────────────────────

func TestScoreRiver_NoData(t *testing.T) {
	f := scoreRiver(RiverDischarge{})
	if f.Score != 0 {
		t.Errorf("no data should score 0, got %f", f.Score)
	}
}

func TestScoreRiver_BelowMedian(t *testing.T) {
	d := RiverDischarge{CurrentM3s: 50, MedianM3s: 100, RatioToMedian: 0.5}
	f := scoreRiver(d)
	if f.Score != 0 {
		t.Errorf("below-median discharge should score 0, got %f", f.Score)
	}
}

func TestScoreRiver_5xMedian_MaxScore(t *testing.T) {
	d := RiverDischarge{CurrentM3s: 500, MedianM3s: 100, RatioToMedian: 5.0}
	f := scoreRiver(d)
	if f.Score < 90 {
		t.Errorf("5× median discharge should score >=90, got %f", f.Score)
	}
}

func TestScoreRiver_Weight(t *testing.T) {
	f := scoreRiver(RiverDischarge{})
	if f.Weight != 0.30 {
		t.Errorf("river weight should be 0.30, got %f", f.Weight)
	}
}

// ──────────────────────────────── soil moisture scoring ──────────────────────

func TestScoreSoil_DrySoil_LowScore(t *testing.T) {
	f := scoreSoil(0.1)
	if f.Score > 20 {
		t.Errorf("dry soil (10%%) should score <=20, got %f", f.Score)
	}
}

func TestScoreSoil_SaturatedSoil_HighScore(t *testing.T) {
	f := scoreSoil(0.7) // saturation threshold
	if f.Score < 95 {
		t.Errorf("saturated soil should score >=95, got %f", f.Score)
	}
}

func TestScoreSoil_AboveSaturation_Clamped(t *testing.T) {
	f := scoreSoil(1.0)
	if f.Score > 100 {
		t.Errorf("score should be clamped at 100, got %f", f.Score)
	}
}

func TestScoreSoil_Weight(t *testing.T) {
	f := scoreSoil(0.3)
	if f.Weight != 0.20 {
		t.Errorf("soil weight should be 0.20, got %f", f.Weight)
	}
}

// ──────────────────────────────── historical scoring ─────────────────────────

func TestScoreHistorical_NilArchive_NeutralScore(t *testing.T) {
	f := scoreHistorical(nil, 50)
	if f.Score != 50 {
		t.Errorf("nil archive should return neutral score 50, got %f", f.Score)
	}
}

func TestScoreHistorical_HighAnomaly_HighScore(t *testing.T) {
	// Historical avg = 1mm/day → 3-day baseline = 3mm
	// Forecast = 60mm → ratio = 20× → max score
	daily := make([]float64, 30)
	for i := range daily {
		daily[i] = 1.0
	}
	ar := makeArchiveFlood(daily)
	f := scoreHistorical(ar, 60)
	if f.Score < 80 {
		t.Errorf("large anomaly should score >=80, got %f", f.Score)
	}
}

func TestScoreHistorical_Weight(t *testing.T) {
	f := scoreHistorical(nil, 0)
	if f.Weight != 0.15 {
		t.Errorf("historical weight should be 0.15, got %f", f.Weight)
	}
}

// ──────────────────────────────── classification ─────────────────────────────

func TestClassifyFlood(t *testing.T) {
	tests := []struct {
		score float64
		want  FloodProbability
	}{
		{0, ProbLow},
		{19, ProbLow},
		{20, ProbModerate},
		{44, ProbModerate},
		{45, ProbHigh},
		{69, ProbHigh},
		{70, ProbVeryHigh},
		{100, ProbVeryHigh},
	}
	for _, tc := range tests {
		if got := classifyFlood(tc.score); got != tc.want {
			t.Errorf("classifyFlood(%.0f) = %q, want %q", tc.score, got, tc.want)
		}
	}
}

// ──────────────────────────────── time window ────────────────────────────────

func TestPeakWindow_MostRainIn24h(t *testing.T) {
	pf := PrecipForecast{Next24hMm: 40, Next48hMm: 45, Next72hMm: 50}
	if got := peakWindow(pf); got != Window24h {
		t.Errorf("expected 24h window, got %s", got)
	}
}

func TestPeakWindow_MostRainIn48h(t *testing.T) {
	pf := PrecipForecast{Next24hMm: 5, Next48hMm: 40, Next72hMm: 45}
	if got := peakWindow(pf); got != Window48h {
		t.Errorf("expected 48h window, got %s", got)
	}
}

func TestPeakWindow_MostRainIn72h(t *testing.T) {
	pf := PrecipForecast{Next24hMm: 5, Next48hMm: 10, Next72hMm: 50}
	if got := peakWindow(pf); got != Window72h {
		t.Errorf("expected 72h window, got %s", got)
	}
}

// ──────────────────────────────── confidence ─────────────────────────────────

func TestCalcConfidence_NoOptionalData(t *testing.T) {
	score := calcConfidence(nil, nil)
	if score != 60 {
		t.Errorf("no optional data should give confidence 60, got %f", score)
	}
}

func TestCalcConfidence_AllSources(t *testing.T) {
	rv := makeRiverResp(100, 80, 200)
	daily := make([]float64, 30)
	ar := makeArchiveFlood(daily)
	score := calcConfidence(rv, ar)
	if score != 100 {
		t.Errorf("all sources should give confidence 100, got %f", score)
	}
}

// ──────────────────────────────── precip windows ─────────────────────────────

func TestExtractPrecipWindows_Correct(t *testing.T) {
	hourly := make([]float64, 72)
	for i := range hourly {
		hourly[i] = 1.0 // 1mm/h
	}
	fc := makeFCFlood(hourly, 0.3)
	pf := extractPrecipWindows(fc)
	if math.Abs(pf.Next24hMm-24) > 0.01 {
		t.Errorf("24h: want 24, got %f", pf.Next24hMm)
	}
	if math.Abs(pf.Next48hMm-48) > 0.01 {
		t.Errorf("48h: want 48, got %f", pf.Next48hMm)
	}
	if math.Abs(pf.Next72hMm-72) > 0.01 {
		t.Errorf("72h: want 72, got %f", pf.Next72hMm)
	}
}

func TestExtractPrecipWindows_NilForecast(t *testing.T) {
	pf := extractPrecipWindows(nil)
	if pf.Next72hMm != 0 {
		t.Error("nil forecast should produce zero windows")
	}
}

// ──────────────────────────────── discharge extraction ───────────────────────

func TestExtractDischarge_RatioCalculated(t *testing.T) {
	rv := makeRiverResp(200, 100, 300)
	d := extractDischarge(rv)
	if math.Abs(d.RatioToMedian-2.0) > 0.01 {
		t.Errorf("ratio should be 2.0, got %f", d.RatioToMedian)
	}
}

func TestExtractDischarge_NilResp(t *testing.T) {
	d := extractDischarge(nil)
	if d.CurrentM3s != 0 || d.RatioToMedian != 0 {
		t.Error("nil response should produce zero discharge")
	}
}

// ──────────────────────────────── recommendations ────────────────────────────

func TestFloodRecommendations_AlwaysHasBase(t *testing.T) {
	recs := floodRecommendations(10, PrecipForecast{}, RiverDischarge{}, Window24h)
	if len(recs) == 0 {
		t.Error("recommendations should never be empty")
	}
}

func TestFloodRecommendations_VeryHighHasAlert(t *testing.T) {
	recs := floodRecommendations(80,
		PrecipForecast{Next24hMm: 50, Next72hMm: 120},
		RiverDischarge{CurrentM3s: 300, MedianM3s: 100, RatioToMedian: 3.0},
		Window24h)
	if len(recs) < 4 {
		t.Errorf("very high risk should produce >=4 recommendations, got %d", len(recs))
	}
}

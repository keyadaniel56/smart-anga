package services

import (
	"fmt"
	"math"
	"time"

	"github.com/anga/backend/internal/config"
)

// FloodPredictor fetches forecast and flood-API data then scores flood risk.
type FloodPredictor struct {
	cfg *config.Config
}

func NewFloodPredictor(cfg *config.Config) *FloodPredictor {
	return &FloodPredictor{cfg: cfg}
}

// ──────────────────────────────── response types ─────────────────────────────

// FloodProbability is the qualitative flood likelihood label.
type FloodProbability string

const (
	ProbLow      FloodProbability = "low"
	ProbModerate FloodProbability = "moderate"
	ProbHigh     FloodProbability = "high"
	ProbVeryHigh FloodProbability = "very_high"
)

// FloodTimeWindow is the forecast horizon at which peak risk is expected.
type FloodTimeWindow string

const (
	Window24h FloodTimeWindow = "24h"
	Window48h FloodTimeWindow = "48h"
	Window72h FloodTimeWindow = "72h"
)

// RiskFactor is one scored component of the flood risk model.
type RiskFactor struct {
	Name        string  `json:"name"`
	Value       float64 `json:"value"`       // raw observed value
	Score       float64 `json:"score"`       // 0–100 normalised risk contribution
	Weight      float64 `json:"weight"`      // contribution weight (all weights sum to 1)
	Unit        string  `json:"unit"`
	Description string  `json:"description"`
}

// FloodPrediction is returned by GET /api/predictions/flood.
type FloodPrediction struct {
	RiskScore       float64          `json:"riskScore"`
	Probability     FloodProbability `json:"probability"`
	Confidence      float64          `json:"confidence"`    // 0–100
	TimeWindow      FloodTimeWindow  `json:"timeWindow"`
	Factors         FloodFactors     `json:"factors"`
	PrecipForecast  PrecipForecast   `json:"precipForecast"`
	RiverDischarge  RiverDischarge   `json:"riverDischarge"`
	Recommendations []string         `json:"recommendations"`
	PredictedAt     string           `json:"predictedAt"`
}

// FloodFactors groups the four named scoring factors.
type FloodFactors struct {
	Precipitation    RiskFactor `json:"precipitation"`
	RiverDischarge   RiskFactor `json:"riverDischarge"`
	SoilMoisture     RiskFactor `json:"soilMoisture"`
	HistoricalPattern RiskFactor `json:"historicalPattern"`
}

// PrecipForecast holds rolling precipitation windows.
type PrecipForecast struct {
	Next24hMm float64 `json:"next24hMm"`
	Next48hMm float64 `json:"next48hMm"`
	Next72hMm float64 `json:"next72hMm"`
}

// RiverDischarge holds current and reference discharge figures.
type RiverDischarge struct {
	CurrentM3s  float64 `json:"currentM3s"`
	MedianM3s   float64 `json:"medianM3s"`
	MaxM3s      float64 `json:"maxM3s"`
	RatioToMedian float64 `json:"ratioToMedian"`
}

// ──────────────────────────────── raw API types ──────────────────────────────

type floodForecastResp struct {
	Hourly struct {
		Time          []string  `json:"time"`
		Precipitation []float64 `json:"precipitation"`
		SoilMoisture  []float64 `json:"soil_moisture_0_to_1cm"`
	} `json:"hourly"`
}

type floodRiverResp struct {
	Daily struct {
		Time               []string  `json:"time"`
		RiverDischarge     []float64 `json:"river_discharge"`
		RiverDischargeMean []float64 `json:"river_discharge_mean"`
		RiverDischargeMax  []float64 `json:"river_discharge_max"`
		RiverDischargeMin  []float64 `json:"river_discharge_min"`
	} `json:"daily"`
}

// floodArchiveResp reuses archiveResponse layout but only needs precipitation.
type floodArchiveResp struct {
	Daily struct {
		Time      []string  `json:"time"`
		PrecipSum []float64 `json:"precipitation_sum"`
	} `json:"daily"`
}

// ──────────────────────────────── main entry ─────────────────────────────────

// Predict fetches live data and returns a flood risk prediction.
func (p *FloodPredictor) Predict(lat, lon float64) (*FloodPrediction, error) {
	// Parallel fetch of all three sources
	type fcRes struct {
		d   *floodForecastResp
		err error
	}
	type rvRes struct {
		d   *floodRiverResp
		err error
	}
	type arRes struct {
		d   *floodArchiveResp
		err error
	}

	fcCh := make(chan fcRes, 1)
	rvCh := make(chan rvRes, 1)
	arCh := make(chan arRes, 1)

	go func() {
		d, err := p.fetchForecast(lat, lon)
		fcCh <- fcRes{d, err}
	}()
	go func() {
		d, err := p.fetchRiver(lat, lon)
		rvCh <- rvRes{d, err}
	}()
	go func() {
		end := time.Now().UTC().AddDate(0, 0, -1)
		start := end.AddDate(0, 0, -89)
		d, err := p.fetchArchive(lat, lon, start, end)
		arCh <- arRes{d, err}
	}()

	fcResult := <-fcCh
	rvResult := <-rvCh
	arResult := <-arCh

	if fcResult.err != nil {
		return nil, fmt.Errorf("forecast fetch: %w", fcResult.err)
	}

	// River and archive failures degrade gracefully
	var rv *floodRiverResp
	if rvResult.err == nil {
		rv = rvResult.d
	}
	var ar *floodArchiveResp
	if arResult.err == nil {
		ar = arResult.d
	}

	return p.compute(fcResult.d, rv, ar), nil
}

// ──────────────────────────────── computation ────────────────────────────────

func (p *FloodPredictor) compute(fc *floodForecastResp, rv *floodRiverResp, ar *floodArchiveResp) *FloodPrediction {
	precip := extractPrecipWindows(fc)
	discharge := extractDischarge(rv)
	soilAvg := avgFlood(latestN(fc.Hourly.SoilMoisture, 24))

	// ── Four risk factors ─────────────────────────────────────────────────────
	precipFactor := scorePrecip(precip)
	riverFactor := scoreRiver(discharge)
	soilFactor := scoreSoil(soilAvg)
	histFactor := scoreHistorical(ar, precip.Next72hMm)

	// ── Weighted composite (weights must sum to 1.0) ──────────────────────────
	riskScore := clampFlood(
		precipFactor.Score*precipFactor.Weight+
			riverFactor.Score*riverFactor.Weight+
			soilFactor.Score*soilFactor.Weight+
			histFactor.Score*histFactor.Weight,
		0, 100,
	)

	timeWindow := peakWindow(precip)
	confidence := calcConfidence(rv, ar)

	return &FloodPrediction{
		RiskScore:   roundFlood(riskScore),
		Probability: classifyFlood(riskScore),
		Confidence:  roundFlood(confidence),
		TimeWindow:  timeWindow,
		Factors: FloodFactors{
			Precipitation:    precipFactor,
			RiverDischarge:   riverFactor,
			SoilMoisture:     soilFactor,
			HistoricalPattern: histFactor,
		},
		PrecipForecast: precip,
		RiverDischarge: discharge,
		Recommendations: floodRecommendations(riskScore, precip, discharge, timeWindow),
		PredictedAt:    time.Now().UTC().Format(time.RFC3339),
	}
}

// ──────────────────────────────── factor scorers ─────────────────────────────

// scorePrecip converts the 72h precipitation forecast into a 0–100 risk score.
// Weight: 0.35 — precipitation is the primary trigger.
func scorePrecip(pf PrecipForecast) RiskFactor {
	// Risk thresholds (mm): 20 → watch, 40 → warning, 80 → high, 120+ → very high
	score := clampFlood(pf.Next72hMm/120*100, 0, 100)

	// Boost if most rain falls in next 24h (flash-flood signal)
	if pf.Next24hMm > 30 {
		score = clampFlood(score+15, 0, 100)
	}

	desc := fmt.Sprintf("%.1fmm forecast over 72h (24h: %.1fmm, 48h: %.1fmm)",
		pf.Next72hMm, pf.Next24hMm, pf.Next48hMm)

	return RiskFactor{
		Name:        "precipitation",
		Value:       roundFlood(pf.Next72hMm),
		Score:       roundFlood(score),
		Weight:      0.35,
		Unit:        "mm",
		Description: desc,
	}
}

// scoreRiver scores river discharge relative to the historical median.
// Weight: 0.30 — river level is the most direct flood indicator.
func scoreRiver(d RiverDischarge) RiskFactor {
	score := 0.0
	desc := "No river discharge data available"

	if d.MedianM3s > 0 {
		// ratio = current / median; 1× = normal, 2× = elevated, 3× = high, 5× = critical
		ratio := d.RatioToMedian
		score = clampFlood((ratio-1)/4*100, 0, 100)
		desc = fmt.Sprintf("%.1f m³/s current vs %.1f m³/s median (ratio: %.2f×)",
			d.CurrentM3s, d.MedianM3s, ratio)
	}

	return RiskFactor{
		Name:        "riverDischarge",
		Value:       roundFlood(d.CurrentM3s),
		Score:       roundFlood(score),
		Weight:      0.30,
		Unit:        "m³/s",
		Description: desc,
	}
}

// scoreSoil scores soil saturation — saturated soil cannot absorb more water.
// Weight: 0.20
func scoreSoil(moistureFraction float64) RiskFactor {
	// soil moisture 0–1; above 0.7 the ground is near-saturated
	score := clampFlood(moistureFraction/0.7*100, 0, 100)
	return RiskFactor{
		Name:        "soilMoisture",
		Value:       roundFlood(moistureFraction * 100),
		Score:       roundFlood(score),
		Weight:      0.20,
		Unit:        "%",
		Description: fmt.Sprintf("Surface soil at %.1f%% moisture; saturation threshold ~70%%", moistureFraction*100),
	}
}

// scoreHistorical compares forecast precip against the 90-day rolling baseline.
// Weight: 0.15
func scoreHistorical(ar *floodArchiveResp, forecastMm float64) RiskFactor {
	if ar == nil || len(ar.Daily.PrecipSum) == 0 {
		return RiskFactor{
			Name:        "historicalPattern",
			Value:       0,
			Score:       50, // neutral when no history
			Weight:      0.15,
			Unit:        "mm",
			Description: "No historical data available — using neutral score",
		}
	}

	// 30-day historical average daily precipitation
	n := len(ar.Daily.PrecipSum)
	window := 30
	if n < window {
		window = n
	}
	hist30 := sumFlood(ar.Daily.PrecipSum[n-window:]) / float64(window)
	// Expected 3-day total from historical average
	expected3Day := hist30 * 3
	ratio := 0.0
	if expected3Day > 0 {
		ratio = forecastMm / expected3Day
	} else if forecastMm > 0 {
		ratio = 3.0 // any rain when historically dry is anomalous
	}

	score := clampFlood((ratio-1)/3*100, 0, 100)
	return RiskFactor{
		Name:        "historicalPattern",
		Value:       roundFlood(forecastMm),
		Score:       roundFlood(score),
		Weight:      0.15,
		Unit:        "mm",
		Description: fmt.Sprintf("Forecast %.1fmm vs 3-day historical baseline %.1fmm (%.1f× anomaly)",
			forecastMm, expected3Day, ratio),
	}
}

// ──────────────────────────────── classification ─────────────────────────────

func classifyFlood(score float64) FloodProbability {
	switch {
	case score >= 70:
		return ProbVeryHigh
	case score >= 45:
		return ProbHigh
	case score >= 20:
		return ProbModerate
	default:
		return ProbLow
	}
}

// peakWindow returns the forecast horizon with the highest precipitation density.
func peakWindow(pf PrecipForecast) FloodTimeWindow {
	// Incremental mm per window
	inc24 := pf.Next24hMm
	inc48 := pf.Next48hMm - pf.Next24hMm
	inc72 := pf.Next72hMm - pf.Next48hMm
	if inc24 >= inc48 && inc24 >= inc72 {
		return Window24h
	}
	if inc48 >= inc24 && inc48 >= inc72 {
		return Window48h
	}
	return Window72h
}

// calcConfidence scores how many data sources were available (0–100).
func calcConfidence(rv *floodRiverResp, ar *floodArchiveResp) float64 {
	// Forecast is always present (required); river and archive are optional
	score := 60.0
	if rv != nil && len(rv.Daily.RiverDischarge) > 0 {
		score += 25
	}
	if ar != nil && len(ar.Daily.PrecipSum) >= 30 {
		score += 15
	}
	return score
}

// ──────────────────────────────── recommendations ────────────────────────────

func floodRecommendations(score float64, pf PrecipForecast, d RiverDischarge, win FloodTimeWindow) []string {
	recs := []string{}

	recs = append(recs, "Monitor river levels and weather forecasts continuously.")

	if pf.Next24hMm > 30 {
		recs = append(recs, fmt.Sprintf(
			"%.0fmm expected in next 24h — prepare flood barriers and move valuables to upper floors.",
			pf.Next24hMm))
	}
	if pf.Next72hMm > 60 {
		recs = append(recs, fmt.Sprintf(
			"Cumulative 72h forecast of %.0fmm — review evacuation routes and brief staff/residents.",
			pf.Next72hMm))
	}

	if d.MedianM3s > 0 && d.RatioToMedian >= 2.0 {
		recs = append(recs, fmt.Sprintf(
			"River discharge %.1f× above median — activate flood response protocol and downstream warnings.",
			d.RatioToMedian))
	} else if d.MedianM3s > 0 && d.RatioToMedian >= 1.5 {
		recs = append(recs, "River level significantly elevated — deploy stream-gauge monitoring team.")
	}

	switch {
	case score >= 70:
		recs = append(recs,
			"Issue RED flood alert. Initiate evacuation of low-lying areas immediately.",
			"Contact emergency management authority and activate incident command.",
			"Deploy pumping equipment to critical infrastructure sites.",
		)
	case score >= 45:
		recs = append(recs,
			"Issue AMBER flood warning. Alert downstream communities and critical facilities.",
			"Pre-position sandbags and temporary flood barriers.",
		)
	case score >= 20:
		recs = append(recs,
			"Issue YELLOW flood watch. Increase monitoring frequency to every 6 hours.",
		)
	}

	recs = append(recs, fmt.Sprintf(
		"Peak risk window: %s — focus resource pre-positioning within this horizon.", win))

	return recs
}

// ──────────────────────────────── data extraction ────────────────────────────

func extractPrecipWindows(fc *floodForecastResp) PrecipForecast {
	if fc == nil {
		return PrecipForecast{}
	}
	p := fc.Hourly.Precipitation
	return PrecipForecast{
		Next24hMm: roundFlood(sumFlood(latestN(p, 24))),
		Next48hMm: roundFlood(sumFlood(latestN(p, 48))),
		Next72hMm: roundFlood(sumFlood(latestN(p, 72))),
	}
}

// latestN returns the last n elements of s (or all of s if len(s) < n).
// For a forecast API with future hours first this should be the first N hours,
// but Open-Meteo returns hours in ascending time order so we take the front.
func latestN(s []float64, n int) []float64 {
	if len(s) == 0 {
		return nil
	}
	if n > len(s) {
		n = len(s)
	}
	return s[:n]
}

func extractDischarge(rv *floodRiverResp) RiverDischarge {
	if rv == nil || len(rv.Daily.RiverDischarge) == 0 {
		return RiverDischarge{}
	}
	d := rv.Daily
	current := d.RiverDischarge[0]
	median := avgFlood(d.RiverDischargeMean)
	maxVal := maxFlood(d.RiverDischargeMax)

	ratio := 0.0
	if median > 0 {
		ratio = current / median
	}
	return RiverDischarge{
		CurrentM3s:    roundFlood(current),
		MedianM3s:     roundFlood(median),
		MaxM3s:        roundFlood(maxVal),
		RatioToMedian: roundFlood(ratio),
	}
}

// ──────────────────────────────── API fetchers ───────────────────────────────

func (p *FloodPredictor) fetchForecast(lat, lon float64) (*floodForecastResp, error) {
	url := fmt.Sprintf(
		"%s/forecast?latitude=%f&longitude=%f"+
			"&hourly=precipitation,soil_moisture_0_to_1cm"+
			"&timezone=auto&forecast_days=3",
		p.cfg.OpenMeteo.BaseURL, lat, lon,
	)
	var out floodForecastResp
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (p *FloodPredictor) fetchRiver(lat, lon float64) (*floodRiverResp, error) {
	url := fmt.Sprintf(
		"%s/flood?latitude=%f&longitude=%f"+
			"&daily=river_discharge,river_discharge_mean,river_discharge_max,river_discharge_min"+
			"&forecast_days=3",
		p.cfg.OpenMeteo.FloodURL, lat, lon,
	)
	var out floodRiverResp
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (p *FloodPredictor) fetchArchive(lat, lon float64, start, end time.Time) (*floodArchiveResp, error) {
	url := fmt.Sprintf(
		"https://archive-api.open-meteo.com/v1/era5?latitude=%f&longitude=%f"+
			"&start_date=%s&end_date=%s"+
			"&daily=precipitation_sum&timezone=UTC",
		lat, lon,
		start.Format("2006-01-02"),
		end.Format("2006-01-02"),
	)
	var out floodArchiveResp
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ──────────────────────────────── math helpers ───────────────────────────────

func clampFlood(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func roundFlood(v float64) float64 {
	return math.Round(v*100) / 100
}

func avgFlood(s []float64) float64 {
	if len(s) == 0 {
		return 0
	}
	t := 0.0
	for _, v := range s {
		t += v
	}
	return t / float64(len(s))
}

func sumFlood(s []float64) float64 {
	t := 0.0
	for _, v := range s {
		t += v
	}
	return t
}

func maxFlood(s []float64) float64 {
	if len(s) == 0 {
		return 0
	}
	m := s[0]
	for _, v := range s[1:] {
		if v > m {
			m = v
		}
	}
	return m
}

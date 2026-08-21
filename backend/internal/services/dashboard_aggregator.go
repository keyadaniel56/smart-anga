package services

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"time"

	"github.com/anga/backend/internal/config"
	"github.com/anga/backend/internal/models"
	"github.com/anga/backend/internal/store"
)

// DashboardAggregator fetches and aggregates multi-source climate risk data.
// The frontend never talks to Open-Meteo directly — all weather calls are made here.
type DashboardAggregator struct {
	cfg   *config.Config
	store *store.Store
}

func NewDashboardAggregator(cfg *config.Config, s *store.Store) *DashboardAggregator {
	return &DashboardAggregator{cfg: cfg, store: s}
}

// ──────────────────────────────── response types ─────────────────────────────

// HazardSummary holds per-hazard risk scores (0–100).
type HazardSummary struct {
	Flood    float64 `json:"flood"`
	Drought  float64 `json:"drought"`
	Heatwave float64 `json:"heatwave"`
	Storm    float64 `json:"storm"`
}

// RiskLevel is a human-readable composite risk classification.
type RiskLevel string

const (
	RiskLow      RiskLevel = "LOW"
	RiskModerate RiskLevel = "MODERATE"
	RiskHigh     RiskLevel = "HIGH"
	RiskVeryHigh RiskLevel = "VERY HIGH"
	RiskExtreme  RiskLevel = "EXTREME"
)

// OverviewResponse is returned by GET /api/dashboard/overview.
type OverviewResponse struct {
	CompositeRiskScore  float64       `json:"compositeRiskScore"`
	RiskLevel           RiskLevel     `json:"riskLevel"`
	ActiveIncidents     int           `json:"activeIncidents"`
	HazardSummary       HazardSummary `json:"hazardSummary"`
	WeatherAlerts       int           `json:"weatherAlerts"`
	SoilMoisturePercent float64       `json:"soilMoisturePercent"`
	TemperatureCelsius  float64       `json:"temperatureCelsius"`
	RiverDischargeLevel string        `json:"riverDischargeLevel"`
	LastUpdated         string        `json:"lastUpdated"`
}

// TrendPoint is one daily data-point in a time-series.
type TrendPoint struct {
	Date          string  `json:"date"`
	Temperature   float64 `json:"temperature"`
	Precipitation float64 `json:"precipitation"`
	SoilMoisture  float64 `json:"soilMoisture"`
	WindSpeed     float64 `json:"windSpeed"`
	Et0           float64 `json:"et0"`
	WeatherCode   int     `json:"weatherCode"`
	FloodRisk     float64 `json:"floodRisk"`
	DroughtRisk   float64 `json:"droughtRisk"`
	HeatwaveRisk  float64 `json:"heatwaveRisk"`
	StormRisk     float64 `json:"stormRisk"`
	CompositeRisk float64 `json:"compositeRisk"`
}

// TrendsResponse is returned by GET /api/dashboard/trends.
type TrendsResponse struct {
	Days   int          `json:"days"`
	Trends []TrendPoint `json:"trends"`
}

// Asset represents a vulnerable asset sourced from the internal database.
type Asset struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Type          string     `json:"type"`
	Coordinates   [2]float64 `json:"coordinates"`
	DistanceKm    float64    `json:"distanceKm"`
	FloodRisk     float64    `json:"floodRisk"`
	DroughtRisk   float64    `json:"droughtRisk"`
	HeatwaveRisk  float64    `json:"heatwaveRisk"`
	StormRisk     float64    `json:"stormRisk"`
	OverallRisk   float64    `json:"overallRisk"`
	RiskLevel     RiskLevel  `json:"riskLevel"`
	PrimaryHazard string     `json:"primaryHazard"`
}

// VulnerableAssetsResponse is returned by GET /api/dashboard/vulnerable-assets.
type VulnerableAssetsResponse struct {
	Total  int     `json:"total"`
	Assets []Asset `json:"assets"`
}

// ──────────────────────────────── raw Open-Meteo structs ─────────────────────

type forecastResponse struct {
	Current struct {
		Temperature2m      float64 `json:"temperature_2m"`
		Precipitation      float64 `json:"precipitation"`
		WindSpeed10m       float64 `json:"wind_speed_10m"`
		RelativeHumidity2m float64 `json:"relative_humidity_2m"`
	} `json:"current"`
	Hourly struct {
		Time          []string  `json:"time"`
		SoilMoisture  []float64 `json:"soil_moisture_0_to_1cm"`
		Precipitation []float64 `json:"precipitation"`
		PrecipProb    []float64 `json:"precipitation_probability"`
		Temperature2m []float64 `json:"temperature_2m"`
		WindSpeed     []float64 `json:"wind_speed_10m"`
	} `json:"hourly"`
	Daily struct {
		Time          []string  `json:"time"`
		TempMax       []float64 `json:"temperature_2m_max"`
		TempMin       []float64 `json:"temperature_2m_min"`
		PrecipSum     []float64 `json:"precipitation_sum"`
		WindSpeedMax  []float64 `json:"wind_speed_10m_max"`
		PrecipProbMax []float64 `json:"precipitation_probability_max"`
	} `json:"daily"`
}

type floodResponse struct {
	Daily struct {
		Time               []string  `json:"time"`
		RiverDischarge     []float64 `json:"river_discharge"`
		RiverDischargeMean []float64 `json:"river_discharge_mean"`
	} `json:"daily"`
}

// archiveResponse maps the ERA5 Historical Weather API hourly fields.
type archiveResponse struct {
	Daily struct {
		Time          []string  `json:"time"`
		TempMax       []float64 `json:"temperature_2m_max"`
		TempMin       []float64 `json:"temperature_2m_min"`
		PrecipSum     []float64 `json:"precipitation_sum"`
		SoilMoisture  []float64 `json:"soil_moisture_0_to_7cm_mean"`
		WindSpeedMax  []float64 `json:"wind_speed_10m_max"`
		Et0           []float64 `json:"et0_fao_evapotranspiration"`
		WeatherCode   []float64 `json:"weather_code"`
	} `json:"daily"`
}

// ──────────────────────────────── public methods ─────────────────────────────

// GetOverview aggregates forecast + flood data and returns a composite risk overview.
// Open-Meteo is called here; the frontend never touches it directly.
func (a *DashboardAggregator) GetOverview(lat, lon float64) (*OverviewResponse, error) {
	fc, err := a.fetchForecast(lat, lon)
	if err != nil {
		return nil, err
	}
	fl, _ := a.fetchFlood(lat, lon) // flood API failure is non-fatal

	hazards := a.scoreHazards(fc, fl)
	composite := compositeScore(hazards)
	soilMoisture := avgFloat64(fc.Hourly.SoilMoisture) * 100 // 0–1 fraction → percent
	riverLevel := classifyRiverDischarge(fl)
	alerts := countAlerts(hazards)

	activeIncidents := 0
	for _, inc := range a.store.GetIncidents() {
		if inc.Status == models.StatusActive || inc.Status == models.StatusInProgress {
			activeIncidents++
		}
	}

	return &OverviewResponse{
		CompositeRiskScore:  round2(composite),
		RiskLevel:           classifyRisk(composite),
		ActiveIncidents:     activeIncidents,
		HazardSummary:       hazards,
		WeatherAlerts:       alerts,
		SoilMoisturePercent: round2(soilMoisture),
		TemperatureCelsius:  round2(fc.Current.Temperature2m),
		RiverDischargeLevel: riverLevel,
		LastUpdated:         time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// GetTrends calls the Open-Meteo Historical Weather API (ERA5 daily aggregates)
// and returns one TrendPoint per day with derived hazard risk scores.
func (a *DashboardAggregator) GetTrends(lat, lon float64, days int) (*TrendsResponse, error) {
	if days <= 0 || days > 365 {
		days = 30
	}

	// ERA5 archive lags ~5 days; use yesterday as safe end date
	end := time.Now().UTC().AddDate(0, 0, -1)
	start := end.AddDate(0, 0, -(days - 1))

	archive, err := a.fetchArchive(lat, lon, start, end)
	if err != nil {
		return nil, err
	}

	trends := buildTrendPoints(archive, days)
	return &TrendsResponse{Days: days, Trends: trends}, nil
}

// GetVulnerableAssets returns assets from the internal database that fall within
// radiusKm of the given coordinates, scored against current hazard levels.
// Open-Meteo is used only to derive hazard scores — not to source the assets.
func (a *DashboardAggregator) GetVulnerableAssets(lat, lon, radiusKm float64) (*VulnerableAssetsResponse, error) {
	if radiusKm <= 0 {
		radiusKm = 10
	}

	// Derive current hazard context from forecast + flood
	fc, _ := a.fetchForecast(lat, lon)
	fl, _ := a.fetchFlood(lat, lon)
	var hazards HazardSummary
	if fc != nil {
		hazards = a.scoreHazards(fc, fl)
	}

	// Pull all assets from the internal store and filter by radius
	candidates := a.store.GetAssets()
	var result []Asset
	for _, dbAsset := range candidates {
		dist := haversineKm(lat, lon, dbAsset.Coordinates[0], dbAsset.Coordinates[1])
		if dist > radiusKm {
			continue
		}
		flood := round2(perAssetHazard(dbAsset.Type, "flood", hazards))
		drought := round2(perAssetHazard(dbAsset.Type, "drought", hazards))
		heatwave := round2(perAssetHazard(dbAsset.Type, "heatwave", hazards))
		storm := round2(perAssetHazard(dbAsset.Type, "storm", hazards))
		overall := round2(compositeScore(HazardSummary{
			Flood: flood, Drought: drought, Heatwave: heatwave, Storm: storm,
		}))

		result = append(result, Asset{
			ID:            dbAsset.ID,
			Name:          dbAsset.Name,
			Type:          dbAsset.Type,
			Coordinates:   dbAsset.Coordinates,
			DistanceKm:    round2(dist),
			FloodRisk:     flood,
			DroughtRisk:   drought,
			HeatwaveRisk:  heatwave,
			StormRisk:     storm,
			OverallRisk:   overall,
			RiskLevel:     classifyRisk(overall),
			PrimaryHazard: dominantHazard(flood, drought, heatwave, storm),
		})
	}

	return &VulnerableAssetsResponse{Total: len(result), Assets: result}, nil
}

// ──────────────────────────────── Open-Meteo fetchers ────────────────────────

func (a *DashboardAggregator) fetchForecast(lat, lon float64) (*forecastResponse, error) {
	url := fmt.Sprintf(
		"%s/forecast?latitude=%f&longitude=%f"+
			"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"+
			"&hourly=temperature_2m,precipitation,precipitation_probability,soil_moisture_0_to_1cm,wind_speed_10m"+
			"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,precipitation_probability_max"+
			"&timezone=auto&forecast_days=7",
		a.cfg.OpenMeteo.BaseURL, lat, lon,
	)
	var out forecastResponse
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (a *DashboardAggregator) fetchFlood(lat, lon float64) (*floodResponse, error) {
	url := fmt.Sprintf(
		"%s/flood?latitude=%f&longitude=%f&daily=river_discharge,river_discharge_mean&forecast_days=7",
		a.cfg.OpenMeteo.FloodURL, lat, lon,
	)
	var out floodResponse
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// fetchArchive calls the ERA5 Historical Weather API for daily aggregates.
func (a *DashboardAggregator) fetchArchive(lat, lon float64, start, end time.Time) (*archiveResponse, error) {
	url := fmt.Sprintf(
		"https://archive-api.open-meteo.com/v1/era5?latitude=%f&longitude=%f"+
			"&start_date=%s&end_date=%s"+
			"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"+
			"soil_moisture_0_to_7cm_mean,wind_speed_10m_max,et0_fao_evapotranspiration,weather_code"+
			"&timezone=UTC",
		lat, lon,
		start.Format("2006-01-02"),
		end.Format("2006-01-02"),
	)
	var out archiveResponse
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func fetchJSON(url string, dest interface{}) error {
	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read body: %w", err)
	}
	return json.Unmarshal(body, dest)
}

// ──────────────────────────────── scoring ────────────────────────────────────

// scoreHazards derives 0–100 risk scores for each hazard category from raw API data.
func (a *DashboardAggregator) scoreHazards(fc *forecastResponse, fl *floodResponse) HazardSummary {
	var h HazardSummary

	// Flood: river discharge ratio + precipitation probability
	if fl != nil && len(fl.Daily.RiverDischarge) > 0 {
		discharge := fl.Daily.RiverDischarge[0]
		mean := avgFloat64(fl.Daily.RiverDischargeMean)
		if mean > 0 {
			h.Flood = clamp((discharge/mean)*30, 0, 70)
		}
	}
	if fc != nil {
		precipProb := avgFloat64(fc.Hourly.PrecipProb)
		h.Flood = clamp(h.Flood+precipProb*0.3, 0, 100)

		// Drought: low soil moisture → high risk (soil fraction 0–1, inverted)
		soilMoist := avgFloat64(fc.Hourly.SoilMoisture)
		h.Drought = clamp((1.0-soilMoist)*80, 0, 100)

		// Heatwave: degrees above 30 °C, scaled
		tempMax := maxFloat64(fc.Daily.TempMax)
		h.Heatwave = clamp((tempMax-30)*5, 0, 100)

		// Storm: wind speed + precipitation intensity
		windMax := maxFloat64(fc.Daily.WindSpeedMax)
		precipMax := maxFloat64(fc.Daily.PrecipSum)
		h.Storm = clamp(windMax*1.5+precipMax*0.5, 0, 100)
	}

	h.Flood = round2(h.Flood)
	h.Drought = round2(h.Drought)
	h.Heatwave = round2(h.Heatwave)
	h.Storm = round2(h.Storm)
	return h
}

// compositeScore computes the weighted composite vulnerability index (0–100).
// Weights: Flood 30%, Drought 25%, Heatwave 25%, Storm 20%.
func compositeScore(h HazardSummary) float64 {
	score := h.Flood*0.30 + h.Drought*0.25 + h.Heatwave*0.25 + h.Storm*0.20
	return clamp(score, 0, 100)
}

// classifyRisk maps a composite score to a named risk level.
func classifyRisk(score float64) RiskLevel {
	switch {
	case score <= 20:
		return RiskLow
	case score <= 40:
		return RiskModerate
	case score <= 60:
		return RiskHigh
	case score <= 80:
		return RiskVeryHigh
	default:
		return RiskExtreme
	}
}

func countAlerts(h HazardSummary) int {
	count := 0
	for _, s := range []float64{h.Flood, h.Drought, h.Heatwave, h.Storm} {
		if s >= 50 {
			count++
		}
	}
	return count
}

func classifyRiverDischarge(fl *floodResponse) string {
	if fl == nil || len(fl.Daily.RiverDischarge) == 0 {
		return "unknown"
	}
	discharge := fl.Daily.RiverDischarge[0]
	mean := avgFloat64(fl.Daily.RiverDischargeMean)
	if mean == 0 {
		return "normal"
	}
	ratio := discharge / mean
	switch {
	case ratio >= 2.0:
		return "critical"
	case ratio >= 1.5:
		return "high"
	case ratio >= 1.2:
		return "elevated"
	case ratio >= 0.8:
		return "normal"
	default:
		return "low"
	}
}

// ──────────────────────────────── trends ─────────────────────────────────────

// buildTrendPoints converts ERA5 daily archive data into TrendPoints.
func buildTrendPoints(ar *archiveResponse, days int) []TrendPoint {
	if ar == nil || len(ar.Daily.Time) == 0 {
		return []TrendPoint{}
	}

	dates := ar.Daily.Time
	if len(dates) > days {
		dates = dates[len(dates)-days:]
	}

	points := make([]TrendPoint, 0, len(dates))
	for i, date := range dates {
		tempMax := safeGet(ar.Daily.TempMax, i)
		tempMin := safeGet(ar.Daily.TempMin, i)
		avgTemp := (tempMax + tempMin) / 2
		precip := safeGet(ar.Daily.PrecipSum, i)
		soil := safeGet(ar.Daily.SoilMoisture, i)
		wind := safeGet(ar.Daily.WindSpeedMax, i)
		et0 := safeGet(ar.Daily.Et0, i)
		wCode := int(safeGet(ar.Daily.WeatherCode, i))

		floodRisk := clamp(precip*2, 0, 100)
		droughtRisk := clamp((1.0-soil)*80, 0, 100)
		heatwaveRisk := clamp((avgTemp-30)*5, 0, 100)
		stormRisk := clamp(wind*1.5+precip*0.5, 0, 100)
		composite := compositeScore(HazardSummary{
			Flood: floodRisk, Drought: droughtRisk,
			Heatwave: heatwaveRisk, Storm: stormRisk,
		})

		points = append(points, TrendPoint{
			Date:          date,
			Temperature:   round2(avgTemp),
			Precipitation: round2(precip),
			SoilMoisture:  round2(soil * 100), // fraction → percent
			WindSpeed:     round2(wind),
			Et0:           round2(et0),
			WeatherCode:   wCode,
			FloodRisk:     round2(floodRisk),
			DroughtRisk:   round2(droughtRisk),
			HeatwaveRisk:  round2(heatwaveRisk),
			StormRisk:     round2(stormRisk),
			CompositeRisk: round2(composite),
		})
	}
	return points
}

// ──────────────────────────────── asset scoring ──────────────────────────────

// perAssetHazard applies type-specific exposure weights to raw hazard scores.
// Each asset type has different vulnerability profiles per hazard.
func perAssetHazard(assetType, hazard string, h HazardSummary) float64 {
	type weights struct{ flood, drought, heatwave, storm float64 }
	profiles := map[string]weights{
		"school":        {0.5, 0.1, 0.8, 0.5},
		"hospital":      {0.6, 0.2, 0.7, 0.5},
		"road":          {0.7, 0.1, 0.2, 0.8},
		"bridge":        {0.9, 0.1, 0.1, 0.7},
		"farm":          {0.6, 0.9, 0.6, 0.5},
		"business":      {0.5, 0.3, 0.5, 0.5},
		"water":         {0.8, 0.7, 0.3, 0.4},
		"population":    {0.6, 0.4, 0.7, 0.5},
		"infrastructure":{0.7, 0.1, 0.2, 0.8},
		"agriculture":   {0.6, 0.9, 0.6, 0.4},
		"healthcare":    {0.6, 0.2, 0.7, 0.5},
		"energy":        {0.5, 0.3, 0.4, 0.7},
		"utilities":     {0.8, 0.6, 0.3, 0.4},
		"residential":   {0.6, 0.3, 0.7, 0.5},
		"education":     {0.5, 0.1, 0.8, 0.5},
		"commercial":    {0.5, 0.3, 0.5, 0.5},
	}

	w, ok := profiles[assetType]
	if !ok {
		w = weights{0.5, 0.5, 0.5, 0.5}
	}

	switch hazard {
	case "flood":
		return clamp(h.Flood*w.flood, 0, 100)
	case "drought":
		return clamp(h.Drought*w.drought, 0, 100)
	case "heatwave":
		return clamp(h.Heatwave*w.heatwave, 0, 100)
	case "storm":
		return clamp(h.Storm*w.storm, 0, 100)
	default:
		return 0
	}
}

func dominantHazard(flood, drought, heatwave, storm float64) string {
	scores := map[string]float64{
		"flood": flood, "drought": drought,
		"heatwave": heatwave, "storm": storm,
	}
	best, bestScore := "flood", -1.0
	for name, score := range scores {
		if score > bestScore {
			best, bestScore = name, score
		}
	}
	return best
}

// ──────────────────────────────── math helpers ───────────────────────────────

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func avgFloat64(s []float64) float64 {
	if len(s) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range s {
		sum += v
	}
	return sum / float64(len(s))
}

func maxFloat64(s []float64) float64 {
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

// safeGet returns s[i] if in bounds, else 0.
func safeGet(s []float64, i int) float64 {
	if i < len(s) {
		return s[i]
	}
	return 0
}

// haversineKm returns the great-circle distance in kilometres.
func haversineKm(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	return R * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

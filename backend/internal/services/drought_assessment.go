package services

import (
	"fmt"
	"math"
	"time"

	"github.com/anga/backend/internal/config"
)

// DroughtAssessor fetches soil moisture and precipitation data from Open-Meteo
// and produces a drought risk assessment.
type DroughtAssessor struct {
	cfg *config.Config
}

func NewDroughtAssessor(cfg *config.Config) *DroughtAssessor {
	return &DroughtAssessor{cfg: cfg}
}

// ──────────────────────────────── response type ──────────────────────────────

// DroughtSeverity classifies how serious current drought conditions are.
type DroughtSeverity string

const (
	SeverityNone      DroughtSeverity = "none"
	SeverityWatch     DroughtSeverity = "watch"
	SeverityWarning   DroughtSeverity = "warning"
	SeverityEmergency DroughtSeverity = "emergency"
)

// DroughtTrend indicates whether conditions are getting better or worse.
type DroughtTrend string

const (
	TrendImproving  DroughtTrend = "improving"
	TrendStable     DroughtTrend = "stable"
	TrendWorsening  DroughtTrend = "worsening"
)

// DroughtAssessment is returned by GET /api/predictions/drought.
type DroughtAssessment struct {
	DroughtRiskScore      float64         `json:"droughtRiskScore"`
	Severity              DroughtSeverity `json:"severity"`
	SoilMoisturePercent   float64         `json:"soilMoisturePercent"`
	PrecipitationDeficitMm float64        `json:"precipitationDeficitMm"`
	DaysSinceLastRain     int             `json:"daysSinceLastRain"`
	Trend                 DroughtTrend    `json:"trend"`
	SPI                   float64         `json:"spi"`       // Standardized Precipitation Index
	SPIClass              string          `json:"spiClass"`  // WMO SPI classification
	SoilLayers            SoilLayers      `json:"soilLayers"`
	Windows               PrecipWindows   `json:"windows"`
	ImpactOnAgriculture   string          `json:"impactOnAgriculture"`
	Recommendations       []string        `json:"recommendations"`
	AssessedAt            string          `json:"assessedAt"`
}

// SoilLayers holds moisture readings at multiple depths (fraction 0–1 → percent).
type SoilLayers struct {
	Depth0to1cm  float64 `json:"depth0to1cm"`
	Depth1to3cm  float64 `json:"depth1to3cm"`
	Depth3to9cm  float64 `json:"depth3to9cm"`
	Depth9to27cm float64 `json:"depth9to27cm"`
}

// PrecipWindows holds rolling precipitation totals and deficits.
type PrecipWindows struct {
	Last30DaysMm   float64 `json:"last30DaysMm"`
	Last60DaysMm   float64 `json:"last60DaysMm"`
	Last90DaysMm   float64 `json:"last90DaysMm"`
	Deficit30DayMm float64 `json:"deficit30DayMm"`
	Deficit60DayMm float64 `json:"deficit60DayMm"`
	Deficit90DayMm float64 `json:"deficit90DayMm"`
}

// ──────────────────────────────── raw API types ──────────────────────────────

type droughtForecastResp struct {
	Hourly struct {
		Time          []string  `json:"time"`
		SoilMoisture0 []float64 `json:"soil_moisture_0_to_1cm"`
		SoilMoisture1 []float64 `json:"soil_moisture_1_to_3cm"`
		SoilMoisture3 []float64 `json:"soil_moisture_3_to_9cm"`
		SoilMoisture9 []float64 `json:"soil_moisture_9_to_27cm"`
		Precipitation []float64 `json:"precipitation"`
	} `json:"hourly"`
}

type droughtArchiveResp struct {
	Daily struct {
		Time      []string  `json:"time"`
		PrecipSum []float64 `json:"precipitation_sum"`
		SoilMoist []float64 `json:"soil_moisture_0_to_7cm_mean"`
	} `json:"daily"`
}

// ──────────────────────────────── main entry ─────────────────────────────────

// Assess fetches live and historical data then returns a full drought assessment.
func (d *DroughtAssessor) Assess(lat, lon float64) (*DroughtAssessment, error) {
	// Parallel fetch: current forecast for soil moisture + 90-day archive
	type fcResult struct {
		data *droughtForecastResp
		err  error
	}
	type arResult struct {
		data *droughtArchiveResp
		err  error
	}

	fcCh := make(chan fcResult, 1)
	arCh := make(chan arResult, 1)

	go func() {
		data, err := d.fetchForecastDrought(lat, lon)
		fcCh <- fcResult{data, err}
	}()
	go func() {
		end := time.Now().UTC().AddDate(0, 0, -1)
		start := end.AddDate(0, 0, -89) // 90 days inclusive
		data, err := d.fetchArchiveDrought(lat, lon, start, end)
		arCh <- arResult{data, err}
	}()

	fcRes := <-fcCh
	arRes := <-arCh

	if fcRes.err != nil {
		return nil, fmt.Errorf("forecast fetch: %w", fcRes.err)
	}
	// Archive failure is non-fatal; we degrade gracefully
	var ar *droughtArchiveResp
	if arRes.err == nil {
		ar = arRes.data
	}

	return d.compute(fcRes.data, ar), nil
}

// ──────────────────────────────── computation ────────────────────────────────

func (d *DroughtAssessor) compute(fc *droughtForecastResp, ar *droughtArchiveResp) *DroughtAssessment {
	// ── Soil moisture (current — average of last 24 hourly values) ────────────
	layers := extractSoilLayers(fc)
	// Composite soil moisture = weighted average across depths
	// Shallow layers matter most for evaporation; deeper for plant roots
	composite := layers.Depth0to1cm*0.20 + layers.Depth1to3cm*0.25 +
		layers.Depth3to9cm*0.30 + layers.Depth9to27cm*0.25

	// ── Precipitation windows ─────────────────────────────────────────────────
	windows := calcWindows(ar)
	daysSinceRain := daysSinceLastRain(ar)

	// ── SPI approximation ─────────────────────────────────────────────────────
	spi := calcSPI(windows.Last30DaysMm)

	// ── Risk score (0–100) ───────────────────────────────────────────────────
	soilScore := (1.0 - composite) * 100          // low moisture → high score
	precipScore := clampDrought(windows.Deficit30DayMm/2, 0, 50)
	dryDaysScore := clampDrought(float64(daysSinceRain)*1.5, 0, 30)
	spiScore := clampDrought(spiToRiskScore(spi), 0, 20)

	rawScore := soilScore*0.40 + precipScore*0.35 + dryDaysScore*0.15 + spiScore*0.10
	riskScore := roundD(clampDrought(rawScore, 0, 100))

	// ── Trend (compare first vs last 7 days of soil moisture) ─────────────────
	trend := soilMoistureTrend(fc)

	scaled := scaleLayers(layers)

	return &DroughtAssessment{
		DroughtRiskScore:       riskScore,
		Severity:               classifyDrought(riskScore),
		SoilMoisturePercent:    roundD(composite * 100),
		PrecipitationDeficitMm: roundD(windows.Deficit30DayMm),
		DaysSinceLastRain:      daysSinceRain,
		Trend:                  trend,
		SPI:                    roundD(spi),
		SPIClass:               spiClass(spi),
		SoilLayers:             scaled,
		Windows:                windows,
		ImpactOnAgriculture:    agriImpact(riskScore, scaled),
		Recommendations:        recommendations(riskScore, layers, windows, daysSinceRain),
		AssessedAt:             time.Now().UTC().Format(time.RFC3339),
	}
}

// ──────────────────────────────── soil moisture ──────────────────────────────

func extractSoilLayers(fc *droughtForecastResp) SoilLayers {
	if fc == nil {
		return SoilLayers{}
	}
	// Use the last 24 records (most recent day)
	tail := func(s []float64) float64 {
		if len(s) == 0 {
			return 0
		}
		n := 24
		if len(s) < n {
			n = len(s)
		}
		return avgDrought(s[len(s)-n:])
	}
	return SoilLayers{
		Depth0to1cm:  tail(fc.Hourly.SoilMoisture0),
		Depth1to3cm:  tail(fc.Hourly.SoilMoisture1),
		Depth3to9cm:  tail(fc.Hourly.SoilMoisture3),
		Depth9to27cm: tail(fc.Hourly.SoilMoisture9),
	}
}

// scaleLayers converts soil moisture fractions (0–1) to percent (0–100).
func scaleLayers(l SoilLayers) SoilLayers {
	return SoilLayers{
		Depth0to1cm:  roundD(l.Depth0to1cm * 100),
		Depth1to3cm:  roundD(l.Depth1to3cm * 100),
		Depth3to9cm:  roundD(l.Depth3to9cm * 100),
		Depth9to27cm: roundD(l.Depth9to27cm * 100),
	}
}

// soilMoistureTrend compares average soil moisture of first 7 vs last 7 days.
func soilMoistureTrend(fc *droughtForecastResp) DroughtTrend {
	if fc == nil || len(fc.Hourly.SoilMoisture3) < 48 {
		return TrendStable
	}
	s := fc.Hourly.SoilMoisture3
	early := avgDrought(s[:7*24])
	recent := avgDrought(s[len(s)-7*24:])
	delta := recent - early
	switch {
	case delta > 0.02:
		return TrendImproving
	case delta < -0.02:
		return TrendWorsening
	default:
		return TrendStable
	}
}

// ──────────────────────────────── precipitation ──────────────────────────────

// calcWindows aggregates rolling 30/60/90-day precipitation totals and deficits.
// Normal values (mm/day) are rough tropical/subtropical medians; a real system
// would use long-term climatology for the exact grid cell.
func calcWindows(ar *droughtArchiveResp) PrecipWindows {
	if ar == nil || len(ar.Daily.PrecipSum) == 0 {
		return PrecipWindows{}
	}
	daily := ar.Daily.PrecipSum
	n := len(daily)

	sum := func(days int) float64 {
		if days > n {
			days = n
		}
		return sumDrought(daily[n-days:])
	}

	// Expected baselines (mm) for a semi-arid climate like East Africa
	const (
		normalDaily = 2.5 // mm/day baseline
		normal30    = normalDaily * 30
		normal60    = normalDaily * 60
		normal90    = normalDaily * 90
	)

	p30 := sum(30)
	p60 := sum(60)
	p90 := sum(90)

	return PrecipWindows{
		Last30DaysMm:   roundD(p30),
		Last60DaysMm:   roundD(p60),
		Last90DaysMm:   roundD(p90),
		Deficit30DayMm: roundD(clampDrought(normal30-p30, 0, normal30)),
		Deficit60DayMm: roundD(clampDrought(normal60-p60, 0, normal60)),
		Deficit90DayMm: roundD(clampDrought(normal90-p90, 0, normal90)),
	}
}

// daysSinceLastRain counts how many consecutive days from the end had < 1 mm.
func daysSinceLastRain(ar *droughtArchiveResp) int {
	if ar == nil || len(ar.Daily.PrecipSum) == 0 {
		return 0
	}
	days := ar.Daily.PrecipSum
	count := 0
	for i := len(days) - 1; i >= 0; i-- {
		if days[i] >= 1.0 {
			break
		}
		count++
	}
	return count
}

// ──────────────────────────────── SPI ────────────────────────────────────────

// calcSPI approximates the 1-month SPI.
// SPI = (P - μ) / σ  where μ and σ are the climatological mean and std dev.
// We use fixed East Africa 30-day normals as placeholders.
func calcSPI(p30mm float64) float64 {
	const mu = 75.0  // mean monthly precipitation (mm) for reference climate
	const sigma = 40.0
	if sigma == 0 {
		return 0
	}
	return (p30mm - mu) / sigma
}

// spiClass returns the WMO SPI classification label.
func spiClass(spi float64) string {
	switch {
	case spi >= 2.0:
		return "Extremely Wet"
	case spi >= 1.5:
		return "Very Wet"
	case spi >= 1.0:
		return "Moderately Wet"
	case spi >= -0.99:
		return "Near Normal"
	case spi >= -1.49:
		return "Moderately Dry"
	case spi >= -1.99:
		return "Severely Dry"
	default:
		return "Extremely Dry"
	}
}

func spiToRiskScore(spi float64) float64 {
	// Map SPI (-3 to 3) onto a 0–100 risk contribution (negative SPI = more risk)
	return clampDrought((-spi+3)/6*100, 0, 100)
}

// ──────────────────────────────── classification ─────────────────────────────

func classifyDrought(score float64) DroughtSeverity {
	switch {
	case score >= 70:
		return SeverityEmergency
	case score >= 45:
		return SeverityWarning
	case score >= 20:
		return SeverityWatch
	default:
		return SeverityNone
	}
}

// ──────────────────────────────── impact & recommendations ───────────────────

func agriImpact(score float64, layers SoilLayers) string {
	// layers are already in percent (0–100)
	rootZone := layers.Depth3to9cm
	switch {
	case score >= 70 || rootZone < 15:
		return "Critical: crop failure risk high. Irrigation required immediately. " +
			"Consider early harvest of vulnerable crops and activate drought emergency protocols."
	case score >= 45 || rootZone < 25:
		return "Significant: reduced yields expected. Optimize irrigation scheduling, " +
			"suspend water-intensive crops, and monitor soil daily."
	case score >= 20 || rootZone < 35:
		return "Moderate: stress likely for shallow-rooted crops. " +
			"Supplement with targeted irrigation and prioritize drought-tolerant varieties."
	default:
		return "Low: current conditions within normal range. " +
			"Continue standard irrigation schedules and monitor weekly."
	}
}

func recommendations(score float64, layers SoilLayers, win PrecipWindows, dryDays int) []string {
	recs := []string{}

	// Always include monitoring
	recs = append(recs, "Monitor soil moisture at all depths daily using automated sensors.")

	if dryDays >= 14 {
		recs = append(recs, fmt.Sprintf(
			"No significant rainfall in %d days — activate emergency water conservation measures.", dryDays))
	} else if dryDays >= 7 {
		recs = append(recs, fmt.Sprintf(
			"%d consecutive dry days detected — review irrigation schedules.", dryDays))
	}

	if win.Deficit30DayMm > 30 {
		recs = append(recs, fmt.Sprintf(
			"30-day precipitation deficit of %.0f mm — supplement with stored water resources.", win.Deficit30DayMm))
	}

	if win.Deficit90DayMm > 100 {
		recs = append(recs, fmt.Sprintf(
			"90-day cumulative deficit of %.0f mm indicates a prolonged dry period. "+
				"Engage water authorities and plan for medium-term rationing.", win.Deficit90DayMm))
	}

	shallow := layers.Depth0to1cm * 100
	if shallow < 20 {
		recs = append(recs, "Surface soil moisture critically low (<20%). "+
			"Apply mulching to reduce evaporation and protect topsoil.")
	}

	deep := layers.Depth3to9cm * 100
	if deep < 20 {
		recs = append(recs, "Root-zone moisture below 20% — deep irrigation required to maintain crop viability.")
	}

	switch {
	case score >= 70:
		recs = append(recs,
			"Issue community drought emergency alert and coordinate with regional water management authorities.",
			"Restrict non-essential water use and prioritise potable water supply.",
		)
	case score >= 45:
		recs = append(recs,
			"Notify farmers of drought warning status and distribute advisory bulletins.",
			"Audit water storage reserves and repair any leakages immediately.",
		)
	case score >= 20:
		recs = append(recs,
			"Increase monitoring frequency and prepare contingency irrigation plans.",
		)
	}

	return recs
}

// ──────────────────────────────── API fetchers ───────────────────────────────

func (d *DroughtAssessor) fetchForecastDrought(lat, lon float64) (*droughtForecastResp, error) {
	url := fmt.Sprintf(
		"%s/forecast?latitude=%f&longitude=%f"+
			"&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,"+
			"soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,precipitation"+
			"&timezone=auto&forecast_days=7&past_days=7",
		d.cfg.OpenMeteo.BaseURL, lat, lon,
	)
	var out droughtForecastResp
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (d *DroughtAssessor) fetchArchiveDrought(lat, lon float64, start, end time.Time) (*droughtArchiveResp, error) {
	url := fmt.Sprintf(
		"https://archive-api.open-meteo.com/v1/era5?latitude=%f&longitude=%f"+
			"&start_date=%s&end_date=%s"+
			"&daily=precipitation_sum,soil_moisture_0_to_7cm_mean&timezone=UTC",
		lat, lon,
		start.Format("2006-01-02"),
		end.Format("2006-01-02"),
	)
	var out droughtArchiveResp
	if err := fetchJSON(url, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ──────────────────────────────── math helpers ───────────────────────────────

func clampDrought(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func roundD(v float64) float64 {
	return math.Round(v*100) / 100
}

func avgDrought(s []float64) float64 {
	if len(s) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range s {
		sum += v
	}
	return sum / float64(len(s))
}

func sumDrought(s []float64) float64 {
	t := 0.0
	for _, v := range s {
		t += v
	}
	return t
}

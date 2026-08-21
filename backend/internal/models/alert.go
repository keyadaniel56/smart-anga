package models

import "time"

// AlertThresholds defines the criteria for triggering each hazard alert
type AlertThresholds struct {
	FloodDischargePercentile float64 `json:"floodDischargePercentile"` // e.g. 80th percentile
	DroughtSoilMoisture      float64 `json:"droughtSoilMoisture"`     // e.g. < 15%
	DroughtPrecipDeficit     float64 `json:"droughtPrecipDeficit"`    // e.g. > 40mm
	HeatwaveTempC            float64 `json:"heatwaveTempC"`           // e.g. > 35C
	HeatwaveDurationHours    int     `json:"heatwaveDurationHours"`   // e.g. 3+ consecutive hours
	StormWindSpeedKmh        float64 `json:"stormWindSpeedKmh"`       // e.g. > 60 km/h
}

// Alert represents an active or historical triggered alert
type Alert struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`        // flood, drought, heatwave, storm
	Severity    string    `json:"severity"`    // warning, severe, critical
	Description string    `json:"description"`
	Message     string    `json:"message"`
	Lat         float64   `json:"lat"`
	Lon         float64   `json:"lon"`
	TriggeredAt time.Time `json:"triggeredAt"`
	Timestamp   string    `json:"timestamp"`
	Status      string    `json:"status"` // e.g., "active", "resolved"
}

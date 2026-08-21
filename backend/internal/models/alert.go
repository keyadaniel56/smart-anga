package models

type AlertThresholds struct {
	FloodDischargePercentile float64 `json:"floodDischargePercentile"`
	DroughtSoilMoisture      float64 `json:"droughtSoilMoisture"`
	DroughtPrecipDeficit     float64 `json:"droughtPrecipDeficit"`
	HeatwaveTempC            float64 `json:"heatwaveTempC"`
	HeatwaveDurationHours    int     `json:"heatwaveDurationHours"`
	StormWindSpeedKmh        float64 `json:"stormWindSpeedKmh"`
}

type Alert struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`      // flood, drought, heatwave, storm
	Severity  string  `json:"severity"`  // warning, severe, critical
	Message   string  `json:"message"`
	Lat       float64 `json:"lat"`
	Lon       float64 `json:"lon"`
	Timestamp string  `json:"timestamp"`
}

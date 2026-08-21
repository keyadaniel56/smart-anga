package services

import (
	"sync"

	"github.com/anga/backend/internal/models"
)

type AlertEngine struct {
	mu         sync.Mutex
	thresholds models.AlertThresholds
	alerts     []models.Alert
}

func NewAlertEngine() *AlertEngine {
	return &AlertEngine{
		thresholds: models.AlertThresholds{
			FloodDischargePercentile: 80.0,
			DroughtSoilMoisture:      15.0,
			DroughtPrecipDeficit:     40.0,
			HeatwaveTempC:            35.0,
			HeatwaveDurationHours:    3,
			StormWindSpeedKmh:        60.0,
		},
		alerts: []models.Alert{},
	}
}

func (e *AlertEngine) GetThresholds() models.AlertThresholds {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.thresholds
}

func (e *AlertEngine) UpdateThresholds(t models.AlertThresholds) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.thresholds = t
}

func (e *AlertEngine) GetActiveAlerts() []models.Alert {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.alerts
}

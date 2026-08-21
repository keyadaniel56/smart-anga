package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/anga/backend/internal/models"
	"github.com/anga/backend/internal/services"
)

type AlertHandler struct {
	engine *services.AlertEngine
}

func NewAlertHandler(engine *services.AlertEngine) *AlertHandler {
	return &AlertHandler{engine: engine}
}

func (h *AlertHandler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	alerts := h.engine.GetActiveAlerts()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"alerts":  alerts,
	})
}

func (h *AlertHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	thresholds := h.engine.GetThresholds()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"thresholds": thresholds,
	})
}

func (h *AlertHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var thresholds models.AlertThresholds
	if err := json.NewDecoder(r.Body).Decode(&thresholds); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	h.engine.UpdateThresholds(thresholds)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"message":    "Alert thresholds updated successfully",
		"thresholds": thresholds,
	})
}

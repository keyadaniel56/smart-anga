package handlers

import (
	"net/http"
	"strconv"

	"github.com/anga/backend/internal/services"
)

// PredictionsHandler handles all /api/predictions/* endpoints.
type PredictionsHandler struct {
	drought *services.DroughtAssessor
	flood   *services.FloodPredictor
}

func NewPredictionsHandler(drought *services.DroughtAssessor, flood *services.FloodPredictor) *PredictionsHandler {
	return &PredictionsHandler{drought: drought, flood: flood}
}

// GetDrought handles GET /api/predictions/drought?lat=&lon=
func (h *PredictionsHandler) GetDrought(w http.ResponseWriter, r *http.Request) {
	lat, _ := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lon, _ := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if lat == 0 {
		lat = -1.2864 // Nairobi default
	}
	if lon == 0 {
		lon = 36.8172
	}

	assessment, err := h.drought.Assess(lat, lon)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to compute drought assessment",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"data":        assessment,
	})
}

// GetFlood handles GET /api/predictions/flood?lat=&lon=
func (h *PredictionsHandler) GetFlood(w http.ResponseWriter, r *http.Request) {
	lat, _ := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lon, _ := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if lat == 0 {
		lat = -1.2864
	}
	if lon == 0 {
		lon = 36.8172
	}

	prediction, err := h.flood.Predict(lat, lon)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to compute flood prediction",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"data":        prediction,
	})
}

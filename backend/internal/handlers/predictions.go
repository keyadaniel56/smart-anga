package handlers

import (
	"net/http"
	"strconv"

	"github.com/anga/backend/internal/services"
)

// PredictionsHandler handles all /api/predictions/* endpoints.
type PredictionsHandler struct {
	drought *services.DroughtAssessor
}

func NewPredictionsHandler(drought *services.DroughtAssessor) *PredictionsHandler {
	return &PredictionsHandler{drought: drought}
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

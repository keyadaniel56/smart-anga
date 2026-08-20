package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/anga/backend/internal/services"
)

type ClimateHandler struct {
	openMeteo *services.OpenMeteoService
}

func NewClimateHandler(om *services.OpenMeteoService) *ClimateHandler {
	return &ClimateHandler{openMeteo: om}
}

func (h *ClimateHandler) GetLiveClimate(w http.ResponseWriter, r *http.Request) {
	lat, _ := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lon, _ := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)

	if lat == 0 {
		lat = 51.5074
	}
	if lon == 0 {
		lon = -0.1278
	}

	result, err := h.openMeteo.FetchClimateData(lat, lon)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to fetch live meteorological data",
			"fallback": true,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"weather":     result.Weather,
		"flood":       result.Flood,
		"fetchedAt":   time.Now().UTC().Format(time.RFC3339),
	})
}

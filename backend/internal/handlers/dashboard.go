package handlers

import (
	"net/http"
	"strconv"

	"github.com/anga/backend/internal/services"
)

// DashboardHandler handles all /api/dashboard/* endpoints.
type DashboardHandler struct {
	aggregator *services.DashboardAggregator
}

func NewDashboardHandler(agg *services.DashboardAggregator) *DashboardHandler {
	return &DashboardHandler{aggregator: agg}
}

// parseCoordsWithDefaults reads lat/lon query params and falls back to London.
func parseCoordsWithDefaults(r *http.Request) (lat, lon float64) {
	lat, _ = strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lon, _ = strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if lat == 0 {
		lat = 51.5074
	}
	if lon == 0 {
		lon = -0.1278
	}
	return
}

// GetOverview handles GET /api/dashboard/overview
func (h *DashboardHandler) GetOverview(w http.ResponseWriter, r *http.Request) {
	lat, lon := parseCoordsWithDefaults(r)

	overview, err := h.aggregator.GetOverview(lat, lon)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to aggregate dashboard data",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"data":        overview,
	})
}

// GetTrends handles GET /api/dashboard/trends
func (h *DashboardHandler) GetTrends(w http.ResponseWriter, r *http.Request) {
	lat, lon := parseCoordsWithDefaults(r)

	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 {
		days = 30
	}

	trends, err := h.aggregator.GetTrends(lat, lon, days)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to fetch historical trend data",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"data":        trends,
	})
}

// GetVulnerableAssets handles GET /api/dashboard/vulnerable-assets
func (h *DashboardHandler) GetVulnerableAssets(w http.ResponseWriter, r *http.Request) {
	lat, lon := parseCoordsWithDefaults(r)

	radius, _ := strconv.ParseFloat(r.URL.Query().Get("radius"), 64)
	if radius <= 0 {
		radius = 10
	}

	assets, err := h.aggregator.GetVulnerableAssets(lat, lon, radius)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"error":   "Failed to fetch vulnerable assets",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"coordinates": map[string]float64{"lat": lat, "lon": lon},
		"radiusKm":    radius,
		"data":        assets,
	})
}

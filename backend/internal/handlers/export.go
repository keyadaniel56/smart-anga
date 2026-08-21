package handlers

import (
	"encoding/csv"
	"encoding/json"
	"net/http"

	"github.com/anga/backend/internal/services"
	"github.com/anga/backend/internal/store"
)

type ExportHandler struct {
	store      *store.Store
	climateSvc *services.OpenMeteoService
}

func NewExportHandler(store *store.Store, climateSvc *services.OpenMeteoService) *ExportHandler {
	return &ExportHandler{store: store, climateSvc: climateSvc}
}

func (h *ExportHandler) ExportIncidents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	format := r.URL.Query().Get("format")
	if format == "" {
		format = "json"
	}

	incidents := h.store.GetIncidents()

	if format == "csv" {
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", "attachment;filename=incidents.csv")
		writer := csv.NewWriter(w)
		defer writer.Flush()

		writer.Write([]string{"ID", "Type", "Severity", "Description", "Timestamp"})
		for _, inc := range incidents {
			writer.Write([]string{inc.ID, inc.Type, inc.Severity, inc.Description, inc.Timestamp})
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"incidents": incidents,
	})
}

func (h *ExportHandler) ExportClimate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	format := r.URL.Query().Get("format")
	if format == "" {
		format = "json"
	}

	// Default coordinates if not provided
	lat, lon := -0.1022, 34.7617
	climateData, err := h.climateSvc.FetchClimate(lat, lon)
	if err != nil {
		http.Error(w, "Failed to fetch climate data", http.StatusInternalServerError)
		return
	}

	if format == "csv" {
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", "attachment;filename=climate.csv")
		writer := csv.NewWriter(w)
		defer writer.Flush()

		writer.Write([]string{"Metric", "Value"})
		writer.Write([]string{"Temperature", string(rune(int(climateData.Temperature)))})
		writer.Write([]string{"Humidity", string(rune(int(climateData.Humidity)))})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"climate": climateData,
	})
}

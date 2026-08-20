package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/anga/backend/internal/models"
	"github.com/anga/backend/internal/store"
)

type IncidentHandler struct {
	store *store.Store
}

func NewIncidentHandler(s *store.Store) *IncidentHandler {
	return &IncidentHandler{store: s}
}

func (h *IncidentHandler) GetIncidents(w http.ResponseWriter, r *http.Request) {
	incidents := h.store.GetIncidents()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"incidents": incidents,
	})
}

func (h *IncidentHandler) CreateIncident(w http.ResponseWriter, r *http.Request) {
	var req models.CreateIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	incident := h.store.CreateIncident(req)
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success":  true,
		"incident": incident,
	})
}

func (h *IncidentHandler) UpdateIncident(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   "Missing incident ID",
		})
		return
	}

	var req models.UpdateIncidentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	incident := h.store.UpdateIncident(id, req)
	if incident == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"error":   "Incident not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"incident": incident,
	})
}



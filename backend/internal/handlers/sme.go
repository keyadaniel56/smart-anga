package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/anga/backend/internal/models"
	"github.com/anga/backend/internal/services"
	"github.com/anga/backend/internal/store"
)

// SMEHandler handles all /api/sme/* endpoints.
type SMEHandler struct {
	store    *store.Store
	assessor *services.SMEAssessor
}

func NewSMEHandler(s *store.Store, assessor *services.SMEAssessor) *SMEHandler {
	return &SMEHandler{store: s, assessor: assessor}
}

// Register handles POST /api/sme
func (h *SMEHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterSMERequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}
	if req.BusinessName == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"error":   "businessName is required",
		})
		return
	}

	sme := h.store.CreateSME(req)
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"sme":     sme,
	})
}

// GetProfile handles GET /api/sme/{id}
func (h *SMEHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sme := h.store.GetSME(id)
	if sme == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"error":   "SME not found",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"sme":     sme,
	})
}

// GetAssessment handles GET /api/sme/{id}/assessment
func (h *SMEHandler) GetAssessment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sme := h.store.GetSME(id)
	if sme == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"error":   "SME not found",
		})
		return
	}

	assessment := h.assessor.Assess(sme)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"assessment": assessment,
	})
}

// GetActionPlan handles GET /api/sme/{id}/action-plan
func (h *SMEHandler) GetActionPlan(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sme := h.store.GetSME(id)
	if sme == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"error":   "SME not found",
		})
		return
	}

	plan := h.assessor.GenerateActionPlan(sme)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"actionPlan": plan,
	})
}

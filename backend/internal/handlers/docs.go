package handlers

import (
	"encoding/json"
	"net/http"
)

type DocsHandler struct{}

func NewDocsHandler() *DocsHandler {
	return &DocsHandler{}
}

func (h *DocsHandler) GetDocs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	docs := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":       "Climate Risk Intelligence Platform API",
			"description": "API documentation for tracking climate data, live incidents, alerts, and data exports.",
			"version":     "1.0.0",
		},
		"paths": map[string]interface{}{
			"/api/health": map[string]interface{}{
				"get": map[string]string{"summary": "Check server health"},
			},
			"/api/register": map[string]interface{}{
				"post": map[string]string{"summary": "Register a new user account"},
			},
			"/api/login": map[string]interface{}{
				"post": map[string]string{"summary": "Authenticate user and get token"},
			},
			"/api/climate/live": map[string]interface{}{
				"get": map[string]string{"summary": "Get live climate metrics"},
			},
			"/api/incidents": map[string]interface{}{
				"get": map[string]string{"summary": "Retrieve all climate and disaster incidents"},
			},
			"/api/alerts": map[string]interface{}{
				"get": map[string]string{"summary": "Get active system alerts"},
			},
			"/api/export/incidents": map[string]interface{}{
				"get": map[string]string{"summary": "Export incident reports in CSV or JSON format (?format=csv|json)"},
			},
			"/api/export/climate": map[string]interface{}{
				"get": map[string]string{"summary": "Export climate telemetry data (?format=csv|json&lat=&lon=)"},
			},
			"/api/docs": map[string]interface{}{
				"get": map[string]string{"summary": "Retrieve OpenAPI-style documentation"},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docs)
}

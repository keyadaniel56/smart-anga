package router

import (
	"net/http"

	"github.com/anga/backend/internal/config"
	"github.com/anga/backend/internal/handlers"
	"github.com/anga/backend/internal/middleware"
	"github.com/anga/backend/internal/services"
	"github.com/anga/backend/internal/store"
)

func NewRouter(cfg *config.Config, s *store.Store, om *services.OpenMeteoService) http.Handler {
	mux := http.NewServeMux()

	incidentHandler := handlers.NewIncidentHandler(s)
	climateHandler := handlers.NewClimateHandler(om)
	authHandler := handlers.NewAuthHandler(s)

	// Initialize Alert Engine and Handler
	alertEngine := services.NewAlertEngine()
	alertHandler := handlers.NewAlertHandler(alertEngine)

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Auth endpoints
	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)

	// Climate endpoints
	mux.HandleFunc("/api/climate/live", climateHandler.GetLiveClimate)

	// Incident endpoints
	mux.HandleFunc("/api/incidents", incidentHandler.GetIncidents)

	// Alert endpoints
	mux.HandleFunc("/api/alerts", alertHandler.GetAlerts)
	mux.HandleFunc("/api/alerts/config", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			alertHandler.UpdateConfig(w, r)
			return
		}
		alertHandler.GetConfig(w, r)
	})

	// Apply global middleware stack
	var handler http.Handler = mux
	handler = middleware.Logger(handler)
	handler = middleware.CORS(cfg.CORSOrigin)(handler)

	return handler
}

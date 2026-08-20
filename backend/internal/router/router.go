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

	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Auth endpoints
	mux.HandleFunc("POST /api/register", authHandler.Register)
	mux.HandleFunc("POST /api/login", authHandler.Login)

	// Climate endpoints
	mux.HandleFunc("GET /api/climate/live", climateHandler.GetLiveClimate)

	// Incident endpoints (Public read, Protected write/update)
	mux.HandleFunc("GET /api/incidents", incidentHandler.GetIncidents)
	mux.HandleFunc("POST /api/incidents", middleware.AuthMiddleware(incidentHandler.CreateIncident))
	mux.HandleFunc("PATCH /api/incidents/{id}", middleware.AuthMiddleware(incidentHandler.UpdateIncident))

	// Apply global middleware stack
	var handler http.Handler = mux
	handler = middleware.Logger(handler)
	handler = middleware.CORS(cfg.CORSOrigin)(handler)

	return handler
}

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
	dashboardHandler := handlers.NewDashboardHandler(services.NewDashboardAggregator(cfg, s))
	smeHandler := handlers.NewSMEHandler(s, services.NewSMEAssessor())
	predictionsHandler := handlers.NewPredictionsHandler(
		services.NewDroughtAssessor(cfg),
		services.NewFloodPredictor(cfg),
	)

	// Static dashboard
	mux.Handle("GET /", http.FileServer(http.Dir("static")))

	// API dashboard UI
	mux.HandleFunc("GET /dashboard/apis", handlers.ServeDashboard)

	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Climate endpoints
	mux.HandleFunc("GET /api/climate/live", climateHandler.GetLiveClimate)

	// Dashboard endpoints
	mux.HandleFunc("GET /api/dashboard/overview", dashboardHandler.GetOverview)
	mux.HandleFunc("GET /api/dashboard/trends", dashboardHandler.GetTrends)
	mux.HandleFunc("GET /api/dashboard/vulnerable-assets", dashboardHandler.GetVulnerableAssets)

	// Predictions endpoints
	mux.HandleFunc("GET /api/predictions/drought", predictionsHandler.GetDrought)
	mux.HandleFunc("GET /api/predictions/flood", predictionsHandler.GetFlood)

	// SME endpoints
	mux.HandleFunc("POST /api/sme", smeHandler.Register)
	mux.HandleFunc("GET /api/sme/{id}", smeHandler.GetProfile)
	mux.HandleFunc("GET /api/sme/{id}/assessment", smeHandler.GetAssessment)
	mux.HandleFunc("GET /api/sme/{id}/action-plan", smeHandler.GetActionPlan)

	// Incident endpoints
	mux.HandleFunc("GET /api/incidents", incidentHandler.GetIncidents)
	mux.HandleFunc("POST /api/incidents", incidentHandler.CreateIncident)
	mux.HandleFunc("PATCH /api/incidents/{id}", incidentHandler.UpdateIncident)

	// Apply middleware stack
	var handler http.Handler = mux
	handler = middleware.Logger(handler)
	handler = middleware.CORS(cfg.CORSOrigin)(handler)

	return handler
}

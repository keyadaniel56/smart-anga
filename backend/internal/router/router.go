package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/anga/backend/internal/config"
	"github.com/anga/backend/internal/handlers"
	"github.com/anga/backend/internal/middleware"
	"github.com/anga/backend/internal/services"
	"github.com/anga/backend/internal/store"
	"github.com/anga/backend/internal/websocket"
)

func NewRouter(cfg *config.Config, s *store.Store, om *services.OpenMeteoService) http.Handler {
	mux := http.NewServeMux()

	incidentHandler := handlers.NewIncidentHandler(s)
	climateHandler := handlers.NewClimateHandler(om)
	authHandler := handlers.NewAuthHandler(s)
	exportHandler := handlers.NewExportHandler(s, om)
	docsHandler := handlers.NewDocsHandler()

	// Initialize Alert Engine and Handler
	alertEngine := services.NewAlertEngine()
	alertHandler := handlers.NewAlertHandler(alertEngine)

	// Initialize WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

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

	// Incident endpoints (Public read, Protected write/update)
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

	// Export endpoints
	mux.HandleFunc("/api/export/incidents", exportHandler.ExportIncidents)
	mux.HandleFunc("/api/export/climate", exportHandler.ExportClimate)

	// Documentation endpoint
	mux.HandleFunc("/api/docs", docsHandler.GetDocs)

	// WebSocket endpoint
	mux.HandleFunc("/ws/climate", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(wsHub, w, r)
	})

	// Serve frontend static files in production
	frontendDir := getEnv("FRONTEND_DIR", "frontend/dist")
	if _, err := os.Stat(frontendDir); err == nil {
		fs := http.Dir(frontendDir)
		fileServer := http.FileServer(fs)

		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// If the path matches an API or WebSocket route, skip
			if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/ws/") {
				http.NotFound(w, r)
				return
			}

			// Try to serve the file directly
			path := filepath.Clean(r.URL.Path)
			if path == "/" {
				path = "/index.html"
			}

			// Check if file exists, if not serve index.html (SPA fallback)
			fullPath := filepath.Join(frontendDir, path)
			if _, err := os.Stat(fullPath); os.IsNotExist(err) {
				r.URL.Path = "/"
			}

			fileServer.ServeHTTP(w, r)
		})
	}

	// Apply global middleware stack
	var handler http.Handler = mux
	handler = middleware.Logger(handler)
	handler = middleware.CORS(cfg.CORSOrigin)(handler)

	return handler
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

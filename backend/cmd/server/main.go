package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/anga/backend/internal/config"
	"github.com/anga/backend/internal/database"
	"github.com/anga/backend/internal/router"
	"github.com/anga/backend/internal/services"
	"github.com/anga/backend/internal/store"
)

func main() {
	cfg := config.Load()

	// Connect to PostgreSQL with retries; start server even if DB is down
	db, err := database.ConnectDB()
	if err != nil {
		log.Printf("WARNING: Database unavailable (%v). Running in degraded mode.", err)
	}

	var s *store.Store
	if db != nil {
		defer db.Close()
		s = store.New(db)
	} else {
		s = store.New(nil)
	}

	om := services.NewOpenMeteoService(cfg)
	handler := router.NewRouter(cfg, s, om)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      handler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("Climate Risk Intelligence Platform running on http://localhost:%d", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	<-done
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited cleanly")
}

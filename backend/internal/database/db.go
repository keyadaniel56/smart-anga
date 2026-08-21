package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

// ConnectDB initializes the PostgreSQL connection pool with retry logic for cloud deployments
func ConnectDB() (*sqlx.DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/smart_anga?sslmode=disable"
	}

	// Render and other cloud providers use postgres:// scheme; pgx expects postgresql://
	dbURL = strings.Replace(dbURL, "postgres://", "postgresql://", 1)

	// Ensure sslmode is set for cloud databases
	if !strings.Contains(dbURL, "sslmode=") {
		if strings.Contains(dbURL, "localhost") || strings.Contains(dbURL, "127.0.0.1") {
			dbURL += "&sslmode=disable"
		} else {
			dbURL += "&sslmode=require"
		}
	}

	var db *sqlx.DB
	var err error

	maxRetries := 5
	for attempt := 1; attempt <= maxRetries; attempt++ {
		db, err = sqlx.Connect("pgx", dbURL)
		if err == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			err = db.PingContext(ctx)
			cancel()
			if err == nil {
				break
			}
			db.Close()
		}

		if attempt == maxRetries {
			return nil, fmt.Errorf("database connection failed after %d attempts: %w", maxRetries, err)
		}

		wait := time.Duration(attempt) * 3 * time.Second
		log.Printf("Database connection attempt %d/%d failed: %v. Retrying in %v...", attempt, maxRetries, err, wait)
		time.Sleep(wait)
	}

	// Configure connection pooling
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	log.Println("Successfully connected to PostgreSQL database.")
	return db, nil
}

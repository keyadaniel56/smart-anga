package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port      int
	CORSOrigin string
	NodeEnv   string
	OpenMeteo OpenMeteoConfig
}

type OpenMeteoConfig struct {
	BaseURL  string
	FloodURL string
}

func Load() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "3001"))

	corsOrigin := getEnv("CORS_ORIGIN", "http://localhost:3000")
	nodeEnv := getEnv("NODE_ENV", "development")
	if nodeEnv == "production" && corsOrigin == "http://localhost:3000" {
		corsOrigin = "*"
	}

	return &Config{
		Port:       port,
		CORSOrigin: corsOrigin,
		NodeEnv:    nodeEnv,
		OpenMeteo: OpenMeteoConfig{
			BaseURL:  "https://api.open-meteo.com/v1",
			FloodURL: "https://flood-api.open-meteo.com/v1",
		},
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

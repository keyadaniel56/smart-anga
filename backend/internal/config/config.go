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

	return &Config{
		Port:       port,
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
		NodeEnv:    getEnv("NODE_ENV", "development"),
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

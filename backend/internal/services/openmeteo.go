package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/anga/backend/internal/config"
)

type OpenMeteoService struct {
	cfg *config.Config
}

type WeatherResult struct {
	Weather interface{} `json:"weather"`
	Flood   interface{} `json:"flood"`
}

func NewOpenMeteoService(cfg *config.Config) *OpenMeteoService {
	return &OpenMeteoService{cfg: cfg}
}

func (s *OpenMeteoService) FetchClimateData(lat, lon float64) (*WeatherResult, error) {
	weatherCh := make(chan interface{}, 1)
	floodCh := make(chan interface{}, 1)
	errCh := make(chan error, 2)

	go func() {
		data, err := s.fetchWeather(lat, lon)
		if err != nil {
			errCh <- err
			return
		}
		weatherCh <- data
	}()

	go func() {
		data, err := s.fetchFlood(lat, lon)
		if err != nil {
			errCh <- err
			return
		}
		floodCh <- data
	}()

	var weather, flood interface{}
	weatherSet, floodSet := false, false

	for i := 0; i < 2; i++ {
		select {
		case w := <-weatherCh:
			weather = w
			weatherSet = true
		case f := <-floodCh:
			flood = f
			floodSet = true
		case <-errCh:
			// Continue with nil for failed requests
		}
	}

	_ = weatherSet
	_ = floodSet

	return &WeatherResult{Weather: weather, Flood: flood}, nil
}

func (s *OpenMeteoService) fetchWeather(lat, lon float64) (interface{}, error) {
	url := fmt.Sprintf(
		"%s/forecast?latitude=%f&longitude=%f&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_temperature_0cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max&timezone=auto",
		s.cfg.OpenMeteo.BaseURL, lat, lon,
	)
	return s.fetch(url)
}

func (s *OpenMeteoService) fetchFlood(lat, lon float64) (interface{}, error) {
	url := fmt.Sprintf(
		"%s/flood?latitude=%f&longitude=%f&daily=river_discharge,river_discharge_mean,river_discharge_median,river_discharge_max,river_discharge_min&forecast_days=7",
		s.cfg.OpenMeteo.FloodURL, lat, lon,
	)
	return s.fetch(url)
}

func (s *OpenMeteoService) fetch(url string) (interface{}, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body failed: %w", err)
	}

	var result interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("unmarshal failed: %w", err)
	}

	return result, nil
}

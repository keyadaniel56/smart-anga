package handlers

import (
	_ "embed"
	"net/http"
)

//go:embed apidash.html
var apiDashHTML []byte

func ServeDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(apiDashHTML)
}

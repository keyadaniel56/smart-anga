package middleware

import (
    "context"
    "net/http"
    "strings"

    "github.com/anga/backend/internal/auth"
)

type contextKey string

const (
    UserContextKey contextKey = "user"
    RoleContextKey contextKey = "role"
)

// AuthMiddleware verifies the JWT token in the Authorization header
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Authorization header required", http.StatusUnauthorized)
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
            return
        }

        claims, err := auth.ValidateToken(parts[1])
        if err != nil {
            http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
            return
        }

        // Pass user claims along via context
        ctx := context.WithValue(r.Context(), UserContextKey, claims.Username)
        ctx = context.WithValue(ctx, RoleContextKey, claims.Role)

        next.ServeHTTP(w, r.WithContext(ctx))
    }
}

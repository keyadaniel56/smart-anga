package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/anga/backend/internal/auth"
    "github.com/anga/backend/internal/models"
    "github.com/anga/backend/internal/store"
)

type AuthHandler struct {
    Store *store.Store
}

func NewAuthHandler(s *store.Store) *AuthHandler {
    return &AuthHandler{Store: s}
}

// Register handles user sign-up
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req models.RegisterRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    if req.Username == "" || req.Password == "" {
        http.Error(w, "Username and password are required", http.StatusBadRequest)
        return
    }

    // Hash the password securely
    hashedPassword, err := auth.HashPassword(req.Password)
    if err != nil {
        http.Error(w, "Failed to hash password", http.StatusInternalServerError)
        return
    }

    role := req.Role
    if role == "" {
        role = "viewer" // Default role
    }

    user := models.User{
        Username:     req.Username,
        PasswordHash: hashedPassword,
        Role:         role,
    }

    if err := h.Store.CreateUser(user); err != nil {
        http.Error(w, err.Error(), http.StatusConflict)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// Login handles user authentication and returns a JWT token
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req models.LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    user, err := h.Store.GetUserByUsername(req.Username)
    if err != nil {
        http.Error(w, "Invalid username or password", http.StatusUnauthorized)
        return
    }

    if !auth.CheckPassword(req.Password, user.PasswordHash) {
        http.Error(w, "Invalid username or password", http.StatusUnauthorized)
        return
    }

    // Generate JWT token
    token, err := auth.GenerateToken(user.Username, user.Role)
    if err != nil {
        http.Error(w, "Failed to generate token", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "token":    token,
        "username": user.Username,
        "role":     user.Role,
    })
}

package handler

import (
	"net/http"

	"github.com/mandyl/ext-auth-service/internal/validator"
)

// AuthHandler handles POST /auth requests from Higress ext-auth plugin.
type AuthHandler struct {
	validator *validator.Validator
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(v *validator.Validator) *AuthHandler {
	return &AuthHandler{validator: v}
}

// ServeHTTP implements http.Handler for the /auth endpoint.
func (h *AuthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	result, errCode := h.validator.Validate(authHeader)

	if result.Valid {
		w.Header().Set("x-user-id", result.UserID)
		w.Header().Set("x-auth-version", "1.0")
		w.WriteHeader(http.StatusOK)
		return
	}

	// Determine status code based on error type.
	statusCode := http.StatusUnauthorized
	if errCode == "token_expired_or_not_found" {
		statusCode = http.StatusForbidden
	}

	w.Header().Set("x-auth-error", errCode)
	if statusCode == http.StatusUnauthorized {
		w.Header().Set("WWW-Authenticate", `Bearer realm="mcp-service"`)
	}
	w.WriteHeader(statusCode)
}

// HealthHandler handles GET /health requests.
type HealthHandler struct{}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

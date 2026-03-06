package validator

import (
	"strings"
	"sync"
	"time"

	"github.com/mandyl/ext-auth-service/pkg/config"
)

// Result represents the outcome of a token validation.
type Result struct {
	Valid  bool
	UserID string
}

// Validator validates Bearer tokens against a loaded config.
type Validator struct {
	mu     sync.RWMutex
	tokens map[string]config.TokenEntry
}

// New creates a Validator from the provided config.
func New(cfg *config.Config) *Validator {
	v := &Validator{
		tokens: make(map[string]config.TokenEntry, len(cfg.Tokens)),
	}
	for _, t := range cfg.Tokens {
		v.tokens[t.Value] = t
	}
	return v
}

// Validate checks the Authorization header value.
// It expects the format: "Bearer <token>".
// Returns (result, errCode) where errCode is one of:
//
//	""                          → valid
//	"missing_or_invalid_token"  → header absent or bad format
//	"token_expired_or_not_found" → token not found or expired
func (v *Validator) Validate(authHeader string) (Result, string) {
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return Result{}, "missing_or_invalid_token"
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	token = strings.TrimSpace(token)
	if token == "" {
		return Result{}, "missing_or_invalid_token"
	}

	v.mu.RLock()
	entry, ok := v.tokens[token]
	v.mu.RUnlock()

	if !ok {
		return Result{}, "token_expired_or_not_found"
	}

	// ExpiresAt == 0 means never expires.
	if entry.ExpiresAt != 0 && time.Now().Unix() > entry.ExpiresAt {
		return Result{}, "token_expired_or_not_found"
	}

	return Result{Valid: true, UserID: entry.UserID}, ""
}

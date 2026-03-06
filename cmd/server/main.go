package main

import (
	"log"
	"net/http"
	"os"

	"github.com/mandyl/ext-auth-service/internal/handler"
	"github.com/mandyl/ext-auth-service/internal/validator"
	"github.com/mandyl/ext-auth-service/pkg/config"
)

func main() {
	// Load configuration.
	configPath := getEnv("TOKEN_CONFIG_PATH", "/etc/ext-auth/tokens.yaml")
	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("Failed to load token config: %v", err)
	}
	log.Printf("Loaded %d token(s) from %s", len(cfg.Tokens), configPath)

	v := validator.New(cfg)

	mux := http.NewServeMux()
	mux.Handle("/auth", handler.NewAuthHandler(v))
	mux.Handle("/health", &handler.HealthHandler{})

	port := getEnv("PORT", "8090")
	addr := ":" + port
	log.Printf("ext-auth-service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

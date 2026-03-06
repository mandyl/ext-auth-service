package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// TokenEntry represents a single valid token entry in the ConfigMap.
type TokenEntry struct {
	Value       string `yaml:"value"`
	UserID      string `yaml:"user_id"`
	Description string `yaml:"description"`
	ExpiresAt   int64  `yaml:"expires_at"` // 0 = never expires
}

// Config holds the parsed token configuration.
type Config struct {
	Tokens []TokenEntry `yaml:"tokens"`
}

// Load reads and parses the token config from the given file path.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file %q: %w", path, err)
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config file %q: %w", path, err)
	}
	return &cfg, nil
}

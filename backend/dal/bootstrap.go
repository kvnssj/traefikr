package dal

import (
	"log"

	"traefikr/utils"
)

// BootstrapServerTransports restores all serverTransport TOML files from database on startup
// This ensures the filesystem state matches the database (source of truth) after a restart
func BootstrapServerTransports(repo *TraefikConfigRepository, tomlWriter *utils.TomlWriter) error {
	if !tomlWriter.IsEnabled() {
		log.Println("TOML writing is disabled (TRAEFIK_CONFIG_PATH not set), skipping serverTransport restoration")
		return nil
	}

	log.Println("Starting serverTransport TOML file restoration...")

	// Query for all enabled serverTransport resources
	configs, err := repo.FindServerTransports()
	if err != nil {
		log.Printf("ERROR: Failed to query serverTransport configs: %v", err)
		return err
	}

	if len(configs) == 0 {
		log.Println("No serverTransport configs found in database")
		return nil
	}

	successCount := 0
	errorCount := 0

	// Restore each serverTransport
	for _, config := range configs {
		if err := tomlWriter.WriteServerTransport(config.Protocol, config.Type, config.Name, config.Config); err != nil {
			log.Printf("ERROR: Failed to restore TOML file for serverTransport %s@%s (protocol=%s): %v",
				config.Name, config.Provider, config.Protocol, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("ServerTransport TOML restoration complete: %d succeeded, %d failed", successCount, errorCount)
	return nil
}

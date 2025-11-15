package models

import (
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DB = gorm.DB

func InitDB() (*DB, error) {
	dbPath := os.Getenv("TRAEFIKR_DB_PATH")
	if dbPath == "" {
		dbPath = "./traefikr.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate models
	err = db.AutoMigrate(&User{}, &APIKey{}, &TraefikConfig{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

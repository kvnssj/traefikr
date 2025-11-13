package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"

	"traefikr/handlers"
	"traefikr/middleware"
	"traefikr/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Initialize database
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Check if admin user exists, if not create one
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count == 0 {
		// Generate random password
		password := generateRandomPassword(16)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		admin := models.User{
			Username:     "admin",
			PasswordHash: string(hashedPassword),
			IsActive:     true,
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}

		fmt.Println("=" + string(make([]byte, 50)))
		fmt.Printf("Initial Admin Credentials\n")
		fmt.Printf("Username: admin\n")
		fmt.Printf("Password: %s\n", password)
		fmt.Println("=" + string(make([]byte, 50)))
		fmt.Println("Please save these credentials! The password will not be shown again.")
	}

	// Initialize Gin router
	r := gin.Default()

	// Set up routes
	setupRoutes(r, db)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func generateRandomPassword(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("Failed to generate random password: %v", err)
	}
	return base64.URLEncoding.EncodeToString(b)[:length]
}

func setupRoutes(r *gin.Engine, db *models.DB) {
	// Initialize handlers
	resourceHandler := handlers.NewResourceHandler(db)
	configHandler := handlers.NewConfigHandler(db)
	entrypointsHandler := handlers.NewEntrypointsHandler()
	providerHandler := handlers.NewProviderHandler(db)
	authHandler := handlers.NewAuthHandler(db)

	// Health check (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		// Authentication endpoints (public)
		api.POST("/auth/login", authHandler.Login)

		// Schema endpoints (public)
		api.GET("/:protocol/:type/schema.json", resourceHandler.GetSchema)

		// Config endpoint (conditional API key auth - for Traefik polling)
		// Requires x-auth-key header if API keys exist in database
		api.GET("/config", middleware.ConditionalAuthMiddleware(db), configHandler.GetConfig)

		// Protected endpoints (require JWT token from user login)
		protected := api.Group("")
		protected.Use(middleware.JWTAuthMiddleware(db))
		{
			// Resource endpoints
			protected.GET("/:protocol/:type", resourceHandler.ListResources)
			protected.GET("/:protocol/:type/:nameProvider", resourceHandler.GetResource)
			protected.POST("/:protocol/:type", resourceHandler.CreateResource)
			protected.PUT("/:protocol/:type/:nameProvider", resourceHandler.UpdateResource)
			protected.DELETE("/:protocol/:type/:nameProvider", resourceHandler.DeleteResource)

			// Entrypoints (read-only)
			protected.GET("/entrypoints", entrypointsHandler.ListEntrypoints)
			protected.GET("/entrypoints/:name", entrypointsHandler.GetEntrypoint)

			// Provider (API key management for Traefik)
			protected.GET("/http/provider", providerHandler.ListAPIKeys)
			protected.POST("/http/provider", providerHandler.CreateAPIKey)
			protected.DELETE("/http/provider/:id", providerHandler.DeleteAPIKey)
		}
	}
}

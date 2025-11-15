package middleware

import (
	"net/http"
	"time"

	"traefikr/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthMiddleware checks for valid API key in x-traefikr-key header
func AuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("x-traefikr-key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing x-traefikr-key header"})
			c.Abort()
			return
		}

		var key models.APIKey
		if err := db.Where("key = ? AND is_active = ?", apiKey, true).First(&key).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		// Update last used timestamp
		now := time.Now()
		db.Model(&key).Update("last_used_at", now)

		// Store API key ID in context for auditing
		c.Set("api_key_id", key.ID)
		c.Next()
	}
}

// ConditionalAuthMiddleware applies auth only if API keys exist in database
func ConditionalAuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var count int64
		db.Model(&models.APIKey{}).Where("is_active = ?", true).Count(&count)

		// If no active API keys exist, skip authentication
		if count == 0 {
			c.Next()
			return
		}

		// Otherwise, require authentication
		AuthMiddleware(db)(c)
	}
}

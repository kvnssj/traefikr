package middleware

import (
	"net/http"
	"time"

	"traefikr/dal"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware checks for valid API key in x-traefikr-key header
func AuthMiddleware(repo *dal.APIKeyRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("x-traefikr-key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing x-traefikr-key header"})
			c.Abort()
			return
		}

		key, err := repo.FindByKey(apiKey)
		if err != nil || !key.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		// Update last used timestamp
		key.LastUsedAt = &time.Time{}
		*key.LastUsedAt = time.Now()
		repo.Update(key)

		// Store API key ID in context for auditing
		c.Set("api_key_id", key.ID)
		c.Next()
	}
}

// ConditionalAuthMiddleware applies auth only if API keys exist in database
func ConditionalAuthMiddleware(repo *dal.APIKeyRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		count, err := repo.Count()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			c.Abort()
			return
		}

		// If no active API keys exist, skip authentication
		if count == 0 {
			c.Next()
			return
		}

		// Otherwise, require authentication
		AuthMiddleware(repo)(c)
	}
}

package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"strconv"

	"traefikr/dal"
	"traefikr/models"

	"github.com/gin-gonic/gin"
)

type ProviderHandler struct {
	repo *dal.APIKeyRepository
}

func NewProviderHandler(repo *dal.APIKeyRepository) *ProviderHandler {
	return &ProviderHandler{repo: repo}
}

// ListAPIKeys handles GET /api/http/provider
func (h *ProviderHandler) ListAPIKeys(c *gin.Context) {
	keys, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch API keys"})
		return
	}

	// Convert to response format with masked keys
	responses := make([]models.APIKeyResponse, len(keys))
	for i, key := range keys {
		responses[i] = key.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// CreateAPIKey handles POST /api/http/provider
func (h *ProviderHandler) CreateAPIKey(c *gin.Context) {
	var req struct {
		Name    string `json:"name" binding:"required"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate random API key
	apiKey, err := generateAPIKey()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate API key"})
		return
	}

	// Create API key (standalone, not linked to user)
	key := &models.APIKey{
		Key:      apiKey,
		Name:     req.Name,
		Comment:  req.Comment,
		IsActive: true,
	}

	if err := h.repo.Create(key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create API key"})
		return
	}

	// Return full key only once
	response := struct {
		ID      uint   `json:"id"`
		Key     string `json:"key"`
		Name    string `json:"name"`
		Comment string `json:"comment"`
	}{
		ID:      key.ID,
		Key:     apiKey,
		Name:    key.Name,
		Comment: key.Comment,
	}

	c.JSON(http.StatusCreated, response)
}

// DeleteAPIKey handles DELETE /api/http/provider/{id}
func (h *ProviderHandler) DeleteAPIKey(c *gin.Context) {
	id := c.Param("id")

	// Convert string id to uint
	idUint, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID"})
		return
	}

	rowsAffected, err := h.repo.Delete(uint(idUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete API key"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "API key not found"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// Helper function to generate secure random API key
func generateAPIKey() (string, error) {
	b := make([]byte, 32) // 256 bits
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "sk_" + base64.URLEncoding.EncodeToString(b), nil
}

package handlers

import (
	"net/http"
	"strings"

	"traefikr/models"
	"traefikr/schemas"
	"traefikr/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ResourceHandler struct {
	db            *gorm.DB
	traefikClient *utils.TraefikClient
}

func NewResourceHandler(db *gorm.DB) *ResourceHandler {
	return &ResourceHandler{
		db:            db,
		traefikClient: utils.NewTraefikClient(),
	}
}

// ListResources handles GET /api/{protocol}/{type}
// Query param: traefik=true|false (default: false)
// - false: returns only resources from database
// - true: returns resources from both database and Traefik
func (h *ResourceHandler) ListResources(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	// Validate protocol
	if !isValidProtocol(protocol) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol"})
		return
	}

	// Validate type
	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type for protocol"})
		return
	}

	// Check traefik query parameter (default: false)
	includeTraefik := c.DefaultQuery("traefik", "false") == "true"

	// Fetch from database
	var dbConfigs []models.TraefikConfig
	h.db.Where("protocol = ? AND type = ? AND enabled = ?", protocol, resourceType, true).Find(&dbConfigs)

	// Create a map to track resources by name@provider
	resourceMap := make(map[string]interface{})

	// Only fetch from Traefik if traefik=true
	if includeTraefik {
		traefikResources, err := h.traefikClient.GetResources(protocol, resourceType)
		if err != nil {
			// Log error but continue - Traefik might not be available
			traefikResources = make([]interface{}, 0)
		}

		// Add Traefik resources first
		for _, res := range traefikResources {
			if resMap, ok := res.(map[string]interface{}); ok {
				if name, nameExists := resMap["name"].(string); nameExists {
					resourceMap[name] = resMap
				}
			}
		}
	}

	// Override with database resources (database is source of truth)
	for _, config := range dbConfigs {
		key := config.Name + "@" + config.Provider
		// Merge the database config with metadata
		resourceMap[key] = map[string]interface{}{
			"name":     config.Name,
			"provider": config.Provider,
			"config":   config.Config,
			"enabled":  config.Enabled,
			"source":   "database",
		}
	}

	// Convert map to array for response
	result := make([]interface{}, 0, len(resourceMap))
	for _, v := range resourceMap {
		result = append(result, v)
	}

	c.JSON(http.StatusOK, result)
}

// GetResource handles GET /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) GetResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	// Validate protocol and type
	if !isValidProtocol(protocol) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol"})
		return
	}

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type for protocol"})
		return
	}

	// Parse name@provider
	name, provider := parseNameProvider(nameProvider)

	// First, try to fetch from database (database is source of truth)
	var config models.TraefikConfig
	err := h.db.Where("name = ? AND provider = ? AND protocol = ? AND type = ?",
		name, provider, protocol, resourceType).First(&config).Error

	if err == nil {
		// Found in database
		c.JSON(http.StatusOK, map[string]interface{}{
			"name":     config.Name,
			"provider": config.Provider,
			"config":   config.Config,
			"enabled":  config.Enabled,
			"source":   "database",
		})
		return
	}

	if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	// Not found in database, try Traefik
	traefikResource, err := h.traefikClient.GetResource(protocol, resourceType, name, provider)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	// Return resource from Traefik
	c.JSON(http.StatusOK, traefikResource)
}

// CreateResource handles POST /api/{protocol}/{type}
func (h *ResourceHandler) CreateResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	if !isValidProtocol(protocol) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol"})
		return
	}

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type for protocol"})
		return
	}

	var req struct {
		Name     string                 `json:"name" binding:"required"`
		Provider string                 `json:"provider"`
		Config   map[string]interface{} `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default provider to "http"
	if req.Provider == "" {
		req.Provider = "http"
	}

	// Validate against JSON schema
	if err := schemas.Validate(protocol, resourceType, req.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
		return
	}

	// Create database entry
	config := models.TraefikConfig{
		Name:     req.Name,
		Provider: req.Provider,
		Protocol: protocol,
		Type:     resourceType,
		Enabled:  true,
		Config:   req.Config,
	}

	if err := h.db.Create(&config).Error; err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "resource already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create resource"})
		return
	}

	c.JSON(http.StatusCreated, config)
}

// UpdateResource handles PUT /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) UpdateResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	if !isValidProtocol(protocol) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol"})
		return
	}

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type for protocol"})
		return
	}

	name, provider := parseNameProvider(nameProvider)

	var req struct {
		Config map[string]interface{} `json:"config" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate against JSON schema
	if err := schemas.Validate(protocol, resourceType, req.Config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": err.Error()})
		return
	}

	// Update database entry
	var config models.TraefikConfig
	if err := h.db.Where("name = ? AND provider = ? AND protocol = ? AND type = ?",
		name, provider, protocol, resourceType).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	config.Config = req.Config
	if err := h.db.Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update resource"})
		return
	}

	c.JSON(http.StatusOK, config)
}

// DeleteResource handles DELETE /api/{protocol}/{type}/{name@provider}
func (h *ResourceHandler) DeleteResource(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")
	nameProvider := c.Param("nameProvider")

	if !isValidProtocol(protocol) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid protocol"})
		return
	}

	if !isValidType(protocol, resourceType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid type for protocol"})
		return
	}

	name, provider := parseNameProvider(nameProvider)

	result := h.db.Where("name = ? AND provider = ? AND protocol = ? AND type = ?",
		name, provider, protocol, resourceType).Delete(&models.TraefikConfig{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete resource"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetSchema handles GET /api/{protocol}/{type}/schema.json
func (h *ResourceHandler) GetSchema(c *gin.Context) {
	protocol := c.Param("protocol")
	resourceType := c.Param("type")

	schema, err := schemas.GetSchema(protocol, resourceType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/json")
	c.String(http.StatusOK, schema)
}

// Helper functions

func isValidProtocol(protocol string) bool {
	return protocol == "http" || protocol == "tcp" || protocol == "udp"
}

func isValidType(protocol, resourceType string) bool {
	validTypes := map[string][]string{
		"http": {"routers", "services", "middlewares", "serversTransport", "tls"},
		"tcp":  {"routers", "services", "middlewares", "serversTransport", "tls"},
		"udp":  {"routers", "services", "middlewares"},
	}

	types, ok := validTypes[protocol]
	if !ok {
		return false
	}

	for _, t := range types {
		if t == resourceType {
			return true
		}
	}
	return false
}

func parseNameProvider(nameProvider string) (string, string) {
	parts := strings.Split(nameProvider, "@")
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return parts[0], "http" // default provider
}

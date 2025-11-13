package handlers

import (
	"net/http"

	"traefikr/utils"

	"github.com/gin-gonic/gin"
)

type EntrypointsHandler struct {
	traefikClient *utils.TraefikClient
}

func NewEntrypointsHandler() *EntrypointsHandler {
	return &EntrypointsHandler{
		traefikClient: utils.NewTraefikClient(),
	}
}

// ListEntrypoints handles GET /api/entrypoints
func (h *EntrypointsHandler) ListEntrypoints(c *gin.Context) {
	entrypoints, err := h.traefikClient.GetEntrypoints()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch entrypoints from Traefik", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entrypoints)
}

// GetEntrypoint handles GET /api/entrypoints/{name}
func (h *EntrypointsHandler) GetEntrypoint(c *gin.Context) {
	name := c.Param("name")

	entrypoint, err := h.traefikClient.GetEntrypoint(name)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch entrypoint from Traefik", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entrypoint)
}

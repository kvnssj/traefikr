package handlers

import (
	"net/http"

	"traefikr/dal"

	"github.com/gin-gonic/gin"
)

type ConfigHandler struct {
	repo *dal.TraefikConfigRepository
}

func NewConfigHandler(repo *dal.TraefikConfigRepository) *ConfigHandler {
	return &ConfigHandler{repo: repo}
}

// Traefik configuration structure with omitempty tags
type TraefikProviderConfig struct {
	HTTP *HTTPProtocol `json:"http,omitempty"`
	TCP  *TCPProtocol  `json:"tcp,omitempty"`
	UDP  *UDPProtocol  `json:"udp,omitempty"`
}

type HTTPProtocol struct {
	Routers          map[string]interface{} `json:"routers,omitempty"`
	Services         map[string]interface{} `json:"services,omitempty"`
	Middlewares      map[string]interface{} `json:"middlewares,omitempty"`
	ServersTransport map[string]interface{} `json:"serversTransport,omitempty"`
	TLS              map[string]interface{} `json:"tls,omitempty"`
}

type TCPProtocol struct {
	Routers          map[string]interface{} `json:"routers,omitempty"`
	Services         map[string]interface{} `json:"services,omitempty"`
	Middlewares      map[string]interface{} `json:"middlewares,omitempty"`
	ServersTransport map[string]interface{} `json:"serversTransport,omitempty"`
	TLS              map[string]interface{} `json:"tls,omitempty"`
}

type UDPProtocol struct {
	Routers     map[string]interface{} `json:"routers,omitempty"`
	Services    map[string]interface{} `json:"services,omitempty"`
	Middlewares map[string]interface{} `json:"middlewares,omitempty"`
}

// GetConfig handles GET /api/config
// Returns the full Traefik configuration in HTTP provider format
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	configs, err := h.repo.FindAllEnabled()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch configuration"})
		return
	}

	// Build Traefik configuration structure
	result := &TraefikProviderConfig{
		HTTP: &HTTPProtocol{
			Routers:     make(map[string]interface{}),
			Services:    make(map[string]interface{}),
			Middlewares: make(map[string]interface{}),
			//ServersTransport: make(map[string]interface{}),
			//TLS: make(map[string]interface{}),
		},
		TCP: &TCPProtocol{
			Routers:     make(map[string]interface{}),
			Services:    make(map[string]interface{}),
			Middlewares: make(map[string]interface{}),
			//ServersTransport: make(map[string]interface{}),
			//TLS: make(map[string]interface{}),
		},
		UDP: &UDPProtocol{
			Routers:     make(map[string]interface{}),
			Services:    make(map[string]interface{}),
			Middlewares: make(map[string]interface{}),
		},
	}

	// Populate configuration
	for _, config := range configs {
		// Use only the name as key (not name@provider) for Traefik HTTP provider format
		key := config.Name

		switch config.Protocol {
		case "http":
			switch config.Type {
			case "routers":
				result.HTTP.Routers[key] = config.Config
			case "services":
				result.HTTP.Services[key] = config.Config
			case "middlewares":
				result.HTTP.Middlewares[key] = config.Config
				//case "serversTransport":
				//	result.HTTP.ServersTransport[key] = config.Config
				//case "tls":
				//	result.HTTP.TLS[key] = config.Config
			}
		case "tcp":
			switch config.Type {
			case "routers":
				result.TCP.Routers[key] = config.Config
			case "services":
				result.TCP.Services[key] = config.Config
			case "middlewares":
				result.TCP.Middlewares[key] = config.Config
				//case "serversTransport":
				//	result.TCP.ServersTransport[key] = config.Config
				//case "tls":
				//	result.TCP.TLS[key] = config.Config
			}
		case "udp":
			switch config.Type {
			case "routers":
				result.UDP.Routers[key] = config.Config
			case "services":
				result.UDP.Services[key] = config.Config
			case "middlewares":
				result.UDP.Middlewares[key] = config.Config
			}
		}
	}

	// Clean up empty protocol sections by setting them to nil
	if len(result.HTTP.Routers) == 0 && len(result.HTTP.Services) == 0 &&
		len(result.HTTP.Middlewares) == 0 { /*&& len(result.HTTP.ServersTransport) == 0 &&
		len(result.HTTP.TLS) == 0 {*/
		result.HTTP = nil
	}
	if len(result.TCP.Routers) == 0 && len(result.TCP.Services) == 0 &&
		len(result.TCP.Middlewares) == 0 { /* && len(result.TCP.ServersTransport) == 0 &&
		len(result.TCP.TLS) == 0 {*/
		result.TCP = nil
	}
	if len(result.UDP.Routers) == 0 && len(result.UDP.Services) == 0 &&
		len(result.UDP.Middlewares) == 0 {
		result.UDP = nil
	}

	// The omitempty tags will automatically exclude empty maps and nil protocol sections
	c.JSON(http.StatusOK, result)
}

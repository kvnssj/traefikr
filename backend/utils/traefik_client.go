package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type TraefikClient struct {
	baseURL string
	client  *http.Client
}

func NewTraefikClient() *TraefikClient {
	baseURL := os.Getenv("TRAEFIK_API_URL")
	if baseURL == "" {
		baseURL = "http://traefik:8080" // Default for docker-compose
	}

	return &TraefikClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetEntrypoints fetches all entrypoints from Traefik
func (tc *TraefikClient) GetEntrypoints() ([]interface{}, error) {
	resp, err := tc.client.Get(fmt.Sprintf("%s/api/entrypoints", tc.baseURL))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch entrypoints: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}

// GetEntrypoint fetches a specific entrypoint from Traefik by name
func (tc *TraefikClient) GetEntrypoint(name string) (map[string]interface{}, error) {
	// Fetch all entrypoints
	entrypoints, err := tc.GetEntrypoints()
	if err != nil {
		return nil, err
	}

	// Find the entrypoint with matching name
	for _, ep := range entrypoints {
		if epMap, ok := ep.(map[string]interface{}); ok {
			if epName, exists := epMap["name"]; exists && epName == name {
				return epMap, nil
			}
		}
	}

	return nil, fmt.Errorf("entrypoint not found: %s", name)
}

// GetResources fetches resources of a specific type from Traefik
func (tc *TraefikClient) GetResources(protocol, resourceType string) ([]interface{}, error) {
	url := fmt.Sprintf("%s/api/%s/%s", tc.baseURL, protocol, resourceType)

	resp, err := tc.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch resources: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Return empty array if endpoint doesn't exist (not an error)
		if resp.StatusCode == http.StatusNotFound {
			return make([]interface{}, 0), nil
		}
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return result, nil
}

// GetResource fetches a specific resource by name and provider from Traefik
func (tc *TraefikClient) GetResource(protocol, resourceType, name, provider string) (map[string]interface{}, error) {
	resources, err := tc.GetResources(protocol, resourceType)
	if err != nil {
		return nil, err
	}

	// Find the resource with matching name and provider
	for _, res := range resources {
		if resMap, ok := res.(map[string]interface{}); ok {
			resName, nameExists := resMap["name"].(string)
			resProvider, providerExists := resMap["provider"].(string)

			if nameExists && providerExists {
				if resName == name+"@"+provider || (resName == name && resProvider == provider) {
					return resMap, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("resource not found in Traefik")
}

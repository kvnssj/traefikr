package models

import (
	"time"
)

type APIKey struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	Key        string     `gorm:"unique;not null" json:"-"`
	Name       string     `gorm:"not null" json:"name"`
	Comment    string     `json:"comment"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	LastUsedAt *time.Time `json:"last_used_at"`
}

// APIKeyResponse is used for GET responses with masked keys
type APIKeyResponse struct {
	ID         uint       `json:"id"`
	KeyPreview string     `json:"key_preview"`
	Name       string     `json:"name"`
	Comment    string     `json:"comment"`
	IsActive   bool       `json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	LastUsedAt *time.Time `json:"last_used_at"`
}

// MaskKey returns the first 8 characters followed by ellipsis
func (k *APIKey) MaskKey() string {
	if len(k.Key) <= 8 {
		return k.Key[:len(k.Key)] + "..."
	}
	return k.Key[:8] + "..."
}

// ToResponse converts APIKey to APIKeyResponse with masked key
func (k *APIKey) ToResponse() APIKeyResponse {
	return APIKeyResponse{
		ID:         k.ID,
		KeyPreview: k.MaskKey(),
		Name:       k.Name,
		Comment:    k.Comment,
		IsActive:   k.IsActive,
		CreatedAt:  k.CreatedAt,
		LastUsedAt: k.LastUsedAt,
	}
}

package dal

import (
	"traefikr/models"

	"gorm.io/gorm"
)

// APIKeyRepository handles all database operations for APIKey
type APIKeyRepository struct {
	db *gorm.DB
}

// NewAPIKeyRepository creates a new repository instance
func NewAPIKeyRepository(db *gorm.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

// Create inserts a new APIKey into the database
func (r *APIKeyRepository) Create(apiKey *models.APIKey) error {
	return r.db.Create(apiKey).Error
}

// FindByKey finds an API key by its key string
func (r *APIKeyRepository) FindByKey(key string) (*models.APIKey, error) {
	var apiKey models.APIKey
	err := r.db.Where("key = ?", key).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// FindByID finds an API key by its ID
func (r *APIKeyRepository) FindByID(id uint) (*models.APIKey, error) {
	var apiKey models.APIKey
	err := r.db.First(&apiKey, id).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// FindAll returns all API keys
func (r *APIKeyRepository) FindAll() ([]models.APIKey, error) {
	var apiKeys []models.APIKey
	err := r.db.Find(&apiKeys).Error
	return apiKeys, err
}

// Count returns the total number of API keys
func (r *APIKeyRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.APIKey{}).Count(&count).Error
	return count, err
}

// Delete removes an API key by ID
func (r *APIKeyRepository) Delete(id uint) (int64, error) {
	result := r.db.Delete(&models.APIKey{}, id)
	return result.RowsAffected, result.Error
}

// Update updates an existing API key
func (r *APIKeyRepository) Update(apiKey *models.APIKey) error {
	return r.db.Save(apiKey).Error
}

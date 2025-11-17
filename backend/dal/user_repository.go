package dal

import (
	"traefikr/models"

	"gorm.io/gorm"
)

// UserRepository handles all database operations for User
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new repository instance
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new User into the database
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// FindByUsername finds a user by username
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates an existing User
func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

// Count returns the total number of users
func (r *UserRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

// Delete removes a User by ID
func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

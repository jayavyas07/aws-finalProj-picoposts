package controllers

import (
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"

	"github.com/gin-gonic/gin"
)

func GetUserByEmail(c *gin.Context) {
	email := c.Param("email")
	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "email": user.Email, "role": user.Role})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	// First, get all employees managed by this user and set their manager_id to NULL
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Find employee record for this user
	var emp models.Employee
	config.DB.Where("user_id = ?", id).First(&emp)

	// Update team members' manager_id to NULL if this person was a manager
	if emp.ID != 0 {
		config.DB.Model(&models.Employee{}).Where("manager_id = ?", emp.ID).Update("manager_id", nil)
	}

	// Delete employee record (will cascade to leaves, goals, reviews via foreign keys)
	config.DB.Where("user_id = ?", id).Delete(&models.Employee{})

	// Delete user (will cascade to all user-related records)
	if err := config.DB.Delete(&models.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted with cascading"})
}

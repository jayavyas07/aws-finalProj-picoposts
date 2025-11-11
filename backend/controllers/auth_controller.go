package controllers

import (
	"net/http"

	"peoplesoft/config"
	"peoplesoft/models"
	"peoplesoft/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var body struct{ Name, Email, Password string }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	user := models.User{Name: body.Name, Email: body.Email, PasswordHash: string(hash), Role: "employee"}
	if tx := config.DB.Create(&user); tx.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already exists or db error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "registered"})
}

func Login(c *gin.Context) {
	var body struct{ Email, Password string }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	var user models.User
	config.DB.Where("email = ?", body.Email).First(&user)
	if user.ID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "bad credentials"})
		return
	}
	token, _ := utils.GenerateToken(user.Email, user.Role)
	c.JSON(http.StatusOK, gin.H{"token": token, "role": user.Role, "email": user.Email})
}

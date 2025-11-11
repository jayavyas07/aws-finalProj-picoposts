package controllers

import (
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"

	"github.com/gin-gonic/gin"
)

func ListPerformance(c *gin.Context) {
	var items []models.Performance
	config.DB.Find(&items)
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func CreatePerformance(c *gin.Context) {
	var p models.Performance
	if err := c.ShouldBindJSON(&p); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error":"invalid"}); return }
	config.DB.Create(&p)
	c.JSON(http.StatusCreated, gin.H{"data": p})
}

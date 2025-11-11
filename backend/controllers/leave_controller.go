package controllers

import (
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"
	"time"

	"github.com/gin-gonic/gin"
)

type LeaveRequest struct {
	UserID uint      `json:"user_id"`
	Start  string    `json:"start_date"`
	End    string    `json:"end_date"`
	Type   string    `json:"type"`
	Reason string    `json:"reason"`
}

func CreateLeave(c *gin.Context) {
	var req LeaveRequest
	if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error":"invalid"}); return }
	start, _ := time.Parse("2006-01-02", req.Start)
	end, _ := time.Parse("2006-01-02", req.End)
	lv := models.Leave{UserID: req.UserID, StartDate: start, EndDate: end, Type: req.Type, Reason: req.Reason, Status: "pending"}
	config.DB.Create(&lv)
	c.JSON(http.StatusCreated, gin.H{"data": lv})
}

func ListLeaves(c *gin.Context) {
	var items []models.Leave
	config.DB.Order("created_at desc").Find(&items)
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func ApproveLeave(c *gin.Context) {
	id := c.Param("id")
	config.DB.Model(&models.Leave{}).Where("id = ?", id).Update("status", "approved")
	c.JSON(http.StatusOK, gin.H{"message":"approved"})
}

func RejectLeave(c *gin.Context) {
	id := c.Param("id")
	config.DB.Model(&models.Leave{}).Where("id = ?", id).Update("status", "rejected")
	c.JSON(http.StatusOK, gin.H{"message":"rejected"})
}

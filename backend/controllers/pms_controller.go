package controllers

import (
	"net/http"
	"strconv"
	"time"

	"peoplesoft/config"
	"peoplesoft/models"

	"github.com/gin-gonic/gin"
)

func mustUser(c *gin.Context) (email, role string) {
	email = c.GetString("email")
	role = c.GetString("role")
	return
}

/* ---------- PERF-1: employee creates/updates goals ---------- */

// POST /api/pms/goals
func CreateGoal(c *gin.Context) {
	email, _ := mustUser(c)
	var userID int64
	if err := config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID).Error; err != nil || userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	var in struct {
		CycleID     uint   `json:"cycle_id" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		Timeline    string `json:"timeline"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	g := models.Goal{
		UserID:      uint(userID),
		CycleID:     in.CycleID,
		Title:       in.Title,
		Description: in.Description,
		Timeline:    in.Timeline,
		Status:      "draft",
	}
	if err := config.DB.Create(&g).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": g})
}

// PUT /api/pms/goals/:id (owner only)
func UpdateGoal(c *gin.Context) {
	email, _ := mustUser(c)
	var userID int64
	_ = config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID)

	id := c.Param("id")
	var in struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		Timeline    *string `json:"timeline"`
		Progress    *int    `json:"progress"`
		Status      *string `json:"status"` // draft|submitted|approved|archived
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	updates := map[string]any{}
	if in.Title != nil {
		updates["title"] = *in.Title
	}
	if in.Description != nil {
		updates["description"] = *in.Description
	}
	if in.Timeline != nil {
		updates["timeline"] = *in.Timeline
	}
	if in.Progress != nil {
		updates["progress"] = *in.Progress
	}
	if in.Status != nil {
		updates["status"] = *in.Status
	}

	tx := config.DB.Model(&models.Goal{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates)
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// GET /api/pms/my-goals?cycle_id=#
func ListMyGoals(c *gin.Context) {
	email, _ := mustUser(c)
	var userID int64
	_ = config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID)

	cycleID := c.Query("cycle_id")
	db := config.DB.Table("goals").Where("user_id = ?", userID)
	if cycleID != "" {
		db = db.Where("cycle_id = ?", cycleID)
	}

	var rows []models.Goal
	if err := db.Order("created_at desc").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ---------- PERF-2: manager reviews goals/progress ---------- */

// GET /api/pms/manager/goals?employee_id=&cycle_id=
func ManagerListEmployeeGoals(c *gin.Context) {
	// (Assumes middleware ensures role = manager/admin)
	emp := c.Query("employee_id")
	cycle := c.Query("cycle_id")

	if emp == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "employee_id required"})
		return
	}
	db := config.DB.Table("goals").Where("user_id = ?", emp)
	if cycle != "" {
		db = db.Where("cycle_id = ?", cycle)
	}

	var rows []models.Goal
	if err := db.Order("created_at desc").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ---------- PERF-3: employee self-assessment ---------- */

// POST /api/pms/self-assess
func SubmitSelfAssessment(c *gin.Context) {
	email, _ := mustUser(c)
	var userID int64
	_ = config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID)

	var in struct {
		CycleID  uint   `json:"cycle_id" binding:"required"`
		Comments string `json:"comments"`
		Rating   *int   `json:"rating"` // optional 1..5
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	s := models.SelfAssessment{
		UserID: uint(userID), CycleID: in.CycleID, Comments: in.Comments, Rating: in.Rating,
		SubmittedAt: time.Now(),
	}
	if err := config.DB.Clauses(
	// upsert on (user_id, cycle_id)
	).Create(&s).Error; err != nil {
		// fallback: try explicit upsert
		config.DB.Where("user_id = ? AND cycle_id = ?", s.UserID, s.CycleID).Delete(&models.SelfAssessment{})
		if err2 := config.DB.Create(&s).Error; err2 != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "submit failed"})
			return
		}
	}
	c.JSON(http.StatusCreated, gin.H{"data": s})
}

/* ---------- PERF-4: manager rating & feedback ---------- */

// POST /api/pms/reviews  (manager/admin)
func CreateOrUpdateReview(c *gin.Context) {
	email, role := mustUser(c)
	if role != "manager" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient privileges"})
		return
	}
	var reviewerID int64
	_ = config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&reviewerID)

	var in struct {
		EmployeeID uint   `json:"employee_id" binding:"required"`
		CycleID    uint   `json:"cycle_id" binding:"required"`
		Rating     int    `json:"rating" binding:"required"` // 1..5
		Comments   string `json:"comments"`
		Status     string `json:"status"` // draft|final
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Rating < 1 || in.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	mv := models.ManagerReview{
		EmployeeID: in.EmployeeID, ReviewerID: uint(reviewerID),
		CycleID: in.CycleID, Rating: in.Rating, Comments: in.Comments,
		Status: in.Status, ReviewedAt: time.Now(),
	}
	// upsert by (employee_id, reviewer_id, cycle_id)
	var existing models.ManagerReview
	config.DB.Where("employee_id=? AND reviewer_id=? AND cycle_id=?", in.EmployeeID, reviewerID, in.CycleID).First(&existing)
	if existing.ID > 0 {
		mv.ID = existing.ID
		if err := config.DB.Model(&existing).Updates(mv).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
	} else {
		if err := config.DB.Create(&mv).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": mv})
}

/* ---------- PERF-5: admin analytics/reporting ---------- */

// GET /api/pms/admin/report?cycle_id=&department_id=
func AdminReport(c *gin.Context) {
	if c.GetString("role") != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient privileges"})
		return
	}
	cycle := c.Query("cycle_id")
	dept := c.Query("department_id")

	q := `
SELECT e.department_id,
       AVG(r.rating)::numeric(10,2) AS avg_rating,
       COUNT(*) AS review_count
FROM manager_reviews r
JOIN users u ON u.id = r.employee_id
JOIN employees e ON e.user_id = u.id
WHERE ($1::int IS NULL OR r.cycle_id = $1::int)
  AND ($2::int IS NULL OR e.department_id = $2::int)
GROUP BY e.department_id
ORDER BY e.department_id;`

	var rows []struct {
		DepartmentID int     `json:"department_id"`
		AvgRating    float64 `json:"avg_rating"`
		ReviewCount  int     `json:"review_count"`
	}
	var cID, dID *int
	if cycle != "" {
		if v, err := strconv.Atoi(cycle); err == nil {
			cID = &v
		}
	}
	if dept != "" {
		if v, err := strconv.Atoi(dept); err == nil {
			dID = &v
		}
	}

	if err := config.DB.Raw(q, cID, dID).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "report failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

/* ---------- PERF-6: review history for a user ---------- */

// GET /api/pms/my-reviews
func MyReviews(c *gin.Context) {
	email, _ := mustUser(c)
	var userID int64
	_ = config.DB.Table("users").Select("id").Where("email = ?", email).Scan(&userID)

	var rows []models.ManagerReview
	if err := config.DB.Where("employee_id = ?", userID).Order("reviewed_at desc").Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

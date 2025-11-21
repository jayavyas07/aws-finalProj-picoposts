package controllers

import (
	"fmt"
	"net/http"
	"peoplesoft/config"
	"peoplesoft/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// DTO to include user fields in the directory row
type EmployeeRow struct {
	ID           uint   `json:"id"`
	UserID       uint   `json:"user_id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Designation  string `json:"designation"`
	DepartmentID uint   `json:"department_id"`
	ManagerID    *uint  `json:"manager_id"`
	Phone        string `json:"phone"`
	Location     string `json:"location"`
}

// GET /api/employees?q=&department_id=&designation=&page=&page_size=
func ListEmployees(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	designation := strings.TrimSpace(c.Query("designation"))
	dept := strings.TrimSpace(c.Query("department_id"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 10
	}

	db := config.DB.Table("employees e").
		Select(`e.id, e.user_id, u.name, u.email, e.designation, e.department_id, e.manager_id, e.phone, e.location`).
		Joins("JOIN users u ON u.id = e.user_id")

	if q != "" {
		like := "%" + q + "%"
		db = db.Where("u.name ILIKE ? OR u.email ILIKE ?", like, like)
	}
	if designation != "" {
		db = db.Where("e.designation ILIKE ?", "%"+designation+"%")
	}
	if dept != "" {
		if did, err := strconv.Atoi(dept); err == nil {
			db = db.Where("e.department_id = ?", did)
		}
	}

	var total int64
	db.Count(&total)

	var rows []EmployeeRow
	if err := db.
		Order("u.name asc").
		Offset((page - 1) * size).
		Limit(size).
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch employees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page": page, "page_size": size, "total": total, "data": rows,
	})
}

func CreateEmployee(c *gin.Context) {
	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	// Add logging
	fmt.Printf("Creating employee: %+v\n", emp)

	if err := config.DB.Create(&emp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create employee: " + err.Error()})
		return
	}

	fmt.Printf("Employee created with ID: %d\n", emp.ID)
	c.JSON(http.StatusCreated, gin.H{"data": emp})
}

// GET /api/employees/:id
func GetEmployee(c *gin.Context) {
	id := c.Param("id")
	var row EmployeeRow
	err := config.DB.Table("employees e").
		Select(`e.id, e.user_id, u.name, u.email, e.designation, e.department_id, e.manager_id, e.phone, e.location`).
		Joins("JOIN users u ON u.id = e.user_id").
		Where("e.id = ?", id).
		Scan(&row).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "lookup failed"})
		return
	}
	if row.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": row})
}

// PUT /api/employees/:id
func UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	var in struct {
		Designation  *string `json:"designation"`
		DepartmentID *uint   `json:"department_id"`
		ManagerID    *uint   `json:"manager_id"`
		Phone        *string `json:"phone"`
		Location     *string `json:"location"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	updates := map[string]any{}
	if in.Designation != nil {
		updates["designation"] = *in.Designation
	}
	if in.DepartmentID != nil {
		updates["department_id"] = *in.DepartmentID
	}
	if in.ManagerID != nil {
		updates["manager_id"] = in.ManagerID
	}
	if in.Phone != nil {
		updates["phone"] = *in.Phone
	}
	if in.Location != nil {
		updates["location"] = *in.Location
	}

	tx := config.DB.Model(&models.Employee{}).Where("id = ?", id).Updates(updates)
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

// DELETE /api/employees/:id
func DeleteEmployee(c *gin.Context) {
	id := c.Param("id")
	tx := config.DB.Delete(&models.Employee{}, id)
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GET /api/managers/:managerId/team
func ListTeam(c *gin.Context) {
	managerID := c.Param("managerId")
	var rows []EmployeeRow
	err := config.DB.Table("employees e").
		Select(`e.id, e.user_id, u.name, u.email, e.designation, e.department_id, e.manager_id, e.phone, e.location`).
		Joins("JOIN users u ON u.id = e.user_id").
		Where("e.manager_id = ?", managerID).
		Order("u.name asc").
		Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch team"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": len(rows), "data": rows})
}

// GET /api/my-team  (manager/admin)
// Uses email from JWT to resolve the manager's Employee.ID, then returns direct reports.
func ListMyTeam(c *gin.Context) {
	emailVal, _ := c.Get("email")
	email, _ := emailVal.(string)

	// resolve manager's employee.id from email
	var managerEmp struct{ ID uint }
	if err := config.DB.Table("employees e").
		Select("e.id").
		Joins("JOIN users u ON u.id = e.user_id").
		Where("u.email = ?", email).
		Scan(&managerEmp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve manager profile"})
		return
	}
	if managerEmp.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "manager employee profile not found"})
		return
	}

	// fetch team (direct reports)
	var rows []EmployeeRow
	if err := config.DB.Table("employees e").
		Select(`e.id, e.user_id, u.name, u.email, e.designation, e.department_id, e.manager_id, e.phone, e.location`).
		Joins("JOIN users u ON u.id = e.user_id").
		Where("e.manager_id = ?", managerEmp.ID).
		Order("u.name asc").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch team"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": len(rows), "data": rows})
}

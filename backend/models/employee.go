package models

import "time"

type Employee struct {
	ID           uint   `gorm:"primaryKey"`
	UserID       uint   `gorm:"not null"`
	Designation  string `gorm:"size:100"`
	DepartmentID uint
	ManagerID    *uint // <-- NEW: nullable; manager is an Employee
	Phone        string
	Location     string
	CreatedAt    time.Time
}

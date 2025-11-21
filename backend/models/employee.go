package models

import "time"

type Employee struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"not null" json:"user_id"`
	Designation  string    `gorm:"size:100" json:"designation"`
	DepartmentID uint      `json:"department_id"`
	ManagerID    *uint     `json:"manager_id"`
	Phone        string    `json:"phone"`
	Location     string    `json:"location"`
	CreatedAt    time.Time `json:"created_at"`

	User User `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
}

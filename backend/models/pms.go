package models

import "time"

type ReviewCycle struct {
	ID          uint      `gorm:"primaryKey"`
	Name        string    `gorm:"size:80;not null"`
	PeriodStart time.Time `gorm:"not null"`
	PeriodEnd   time.Time `gorm:"not null"`
	Status      string    `gorm:"size:20;default:open"`
	CreatedAt   time.Time
}

type Goal struct {
	ID          uint   `gorm:"primaryKey"`
	UserID      uint   `gorm:"not null;constraint:OnDelete:CASCADE"`
	CycleID     uint   `gorm:"not null"`
	Title       string `gorm:"size:140;not null"`
	Description string
	Timeline    string `gorm:"size:40"`
	Progress    int    `gorm:"default:0"`
	Status      string `gorm:"size:20;default:draft"`
	CreatedAt   time.Time
}

type SelfAssessment struct {
	ID          uint `gorm:"primaryKey"`
	UserID      uint `gorm:"not null;constraint:OnDelete:CASCADE"`
	CycleID     uint `gorm:"not null"`
	Comments    string
	Rating      *int
	SubmittedAt time.Time
}

type ManagerReview struct {
	ID         uint `gorm:"primaryKey"`
	EmployeeID uint `gorm:"not null;constraint:OnDelete:CASCADE"`
	ReviewerID uint `gorm:"not null;constraint:OnDelete:CASCADE"`
	CycleID    uint `gorm:"not null"`
	Rating     int  `gorm:"not null"`
	Comments   string
	Status     string `gorm:"size:20;default:draft"`
	ReviewedAt time.Time
}

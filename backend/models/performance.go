package models

import "time"

type Performance struct {
	ID         uint `gorm:"primaryKey"`
	UserID     uint `gorm:"not null;constraint:OnDelete:CASCADE"`
	Goal       string
	Rating     int
	Comments   string
	ReviewerID uint
	CreatedAt  time.Time
}

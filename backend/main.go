package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"peoplesoft/config"
	"peoplesoft/models"
	"peoplesoft/routes"
)

func main() {
	_ = godotenv.Load()

	if err := config.ConnectDatabase(); err != nil {
		log.Fatalf("❌ DB connection failed: %v", err)
	}

	// Optional: allow skipping automigrate via env (default: required)
	skip := os.Getenv("AUTO_MIGRATE_SKIP") == "true"
	if !skip {
		if err := config.DB.AutoMigrate(
			&models.User{},
			&models.Employee{},
			&models.Department{},
			&models.Leave{},
			&models.Performance{},
			&models.ReviewCycle{}, &models.Goal{}, &models.SelfAssessment{}, &models.ManagerReview{},
		); err != nil {
			log.Fatalf("❌ AutoMigrate failed: %v", err) // <-- hard stop
		}
		log.Println("✅ AutoMigrate completed")
	} else {
		log.Println("⚠️  Skipping AutoMigrate (AUTO_MIGRATE_SKIP=true)")
	}

	r := gin.Default()
	r.Use(config.CorsMiddleware())

	r.GET("/", func(c *gin.Context) { c.JSON(200, gin.H{"app": "PeopleSoft", "status": "ok"}) })
	routes.SetupRoutes(r)

	log.Println("🚀 PeopleSoft backend running on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

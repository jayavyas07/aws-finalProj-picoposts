package routes

import (
	"fmt"
	"peoplesoft/controllers"
	"peoplesoft/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	api := r.Group("/api")
	api.Use(middleware.AuthRequired())
	{
		// Employees
		fmt.Println("test befote")
		api.GET("/employees", controllers.ListEmployees)
		api.GET("/employees/:id", controllers.GetEmployee)
		api.POST("/employees", controllers.CreateEmployee)
		api.PUT("/employees/:id", controllers.UpdateEmployee)
		api.DELETE("/employees/:id", controllers.DeleteEmployee)
		api.GET("/my-team", controllers.ListMyTeam)

		api.GET("/users/by-email/:email", controllers.GetUserByEmail)
		api.DELETE("/users/:id", controllers.DeleteUser)

		// Manager team
		api.GET("/managers/:managerId/team", controllers.ListTeam)

		// Leaves
		api.GET("/leaves", controllers.ListLeaves)
		api.POST("/leaves", controllers.CreateLeave)
		api.PUT("/leaves/:id/approve", controllers.ApproveLeave)
		api.PUT("/leaves/:id/reject", controllers.RejectLeave)

		// Performance
		api.GET("/performance", controllers.ListPerformance)
		api.POST("/performance", controllers.CreatePerformance)
	}

	//pms
	pms := api.Group("/pms")
	{
		// Employee
		pms.POST("/goals", controllers.CreateGoal)
		pms.PUT("/goals/:id", controllers.UpdateGoal)
		pms.GET("/my-goals", controllers.ListMyGoals)

		// Manager/Admin
		pms.GET("/manager/goals", controllers.ManagerListEmployeeGoals)
		pms.POST("/reviews", controllers.CreateOrUpdateReview)

		// Employee self-assessment
		pms.POST("/self-assess", controllers.SubmitSelfAssessment)

		// Admin analytics
		pms.GET("/admin/report", controllers.AdminReport)

		// History
		pms.GET("/my-reviews", controllers.MyReviews)
	}
}

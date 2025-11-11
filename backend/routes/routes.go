package routes

import (
	"fmt"
	"peoplesoft/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	api := r.Group("/api")
	// err := api.Use(middleware.AuthRequired())
	// if err != nil {
	// 	fmt.Println("auth error")
	// } else {

	// }
	{
		// Employees
		fmt.Println("test befote")
		api.GET("/employees", controllers.ListEmployees)         // EMP-1, EMP-2
		api.GET("/employees/:id", controllers.GetEmployee)       // for profile detail
		api.POST("/employees", controllers.CreateEmployee)       // EMP-3 (admin)
		api.PUT("/employees/:id", controllers.UpdateEmployee)    // EMP-3 (admin)
		api.DELETE("/employees/:id", controllers.DeleteEmployee) // EMP-3 (admin)
		api.GET("/my-team", controllers.ListMyTeam)

		// api.POST("/employees", middleware.RequireRole("admin"), controllers.CreateEmployee)
		// api.PUT("/employees/:id", middleware.RequireRole("admin", "manager"), controllers.UpdateEmployee)
		// api.DELETE("/employees/:id", middleware.RequireRole("admin"), controllers.DeleteEmployee)

		// Manager team
		api.GET("/managers/:managerId/team", controllers.ListTeam) // EMP-4

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
		pms.POST("/goals", controllers.CreateGoal)    // PERF-1
		pms.PUT("/goals/:id", controllers.UpdateGoal) // PERF-1
		pms.GET("/my-goals", controllers.ListMyGoals) // PERF-1

		// Manager/Admin
		pms.GET("/manager/goals", controllers.ManagerListEmployeeGoals) // PERF-2
		pms.POST("/reviews", controllers.CreateOrUpdateReview)          // PERF-4

		// Employee self-assessment
		pms.POST("/self-assess", controllers.SubmitSelfAssessment) // PERF-3

		// Admin analytics
		pms.GET("/admin/report", controllers.AdminReport) // PERF-5

		// History
		pms.GET("/my-reviews", controllers.MyReviews) // PERF-6
	}

}

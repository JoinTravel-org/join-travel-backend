package router

import (
	"join-travel-backend/config"
	"join-travel-backend/internal/controllers"
	"join-travel-backend/internal/repositories"
	"join-travel-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, conf *config.Config) {
	repo := repositories.NewExampleRepository(conf)
	service := services.NewExampleService(conf, repo)
	controller := controllers.NewExampleController(conf, service)

	r.GET("/", controller.GetExample)
}

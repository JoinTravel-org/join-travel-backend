package controllers

import (
	"join-travel-backend/config"
	"join-travel-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type exampleController struct {
	conf    *config.Config
	service services.ExampleService
}

func NewExampleController(conf *config.Config, service services.ExampleService) ExampleController {
	return &exampleController{
		conf:    conf,
		service: service,
	}
}

func (ec *exampleController) GetExample(c *gin.Context) {
	c.JSON(200, gin.H{"message": ec.service.GetExampleData()})
}

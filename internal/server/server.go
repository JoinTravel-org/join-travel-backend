package server

import (
	"join-travel-backend/config"
	"join-travel-backend/internal/router"
	"join-travel-backend/internal/utils/logger"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	conf *config.Config
}

func NewServer(conf *config.Config) *Server {
	return &Server{conf: conf}
}

func (s *Server) Start() error {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS middleware
	r.Use(cors.Default())

	// Routes
	router.SetupRouter(r, s.conf)

	logger.GetLogger().Info("Starting server on port 8080")
	return r.Run("0.0.0.0:8080")
}

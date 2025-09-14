package main

import (
	"join-travel-backend/config"
	"join-travel-backend/internal/server"
	"log"
)

func main() {
	conf := &config.Config{}
	s := server.NewServer(conf)
	err := s.Start()
	if err != nil {
		log.Fatalf("Error %v", err)
	}
}

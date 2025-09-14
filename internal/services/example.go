package services

import (
	"join-travel-backend/config"
	"join-travel-backend/internal/repositories"
)

type exampleService struct {
	conf *config.Config
	repo repositories.ExampleRepository
}

func NewExampleService(conf *config.Config, repo repositories.ExampleRepository) ExampleService {
	return &exampleService{
		conf: conf,
		repo: repo,
	}
}

func (es *exampleService) GetExampleData() string {
	return es.repo.GetExampleRecord()
}

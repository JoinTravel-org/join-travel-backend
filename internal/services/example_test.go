package services_test

import (
	"join-travel-backend/internal/repositories"
	"join-travel-backend/internal/services"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

var service services.ExampleService

func TestMain(m *testing.M) {
	repo := repositories.NewExampleRepository(nil)
	service = services.NewExampleService(nil, repo)
	os.Exit(m.Run())
}

func TestExample(t *testing.T) {
	data := service.GetExampleData()
	assert.Equal(t, "example record", data)
}

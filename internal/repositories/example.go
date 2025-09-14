package repositories

import "join-travel-backend/config"

type exampleRepository struct {
	conf *config.Config
}

func NewExampleRepository(conf *config.Config) ExampleRepository {
	return &exampleRepository{
		conf: conf,
	}
}

func (er *exampleRepository) GetExampleRecord() string {
	return "example record"
}

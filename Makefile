.PHONY: up down dev dev-watch

up:
	docker compose up --build

down:
	docker compose down
	docker compose -f ./docker-compose-dev.yaml down

dev:
	docker compose -f ./docker-compose-dev.yaml up --build

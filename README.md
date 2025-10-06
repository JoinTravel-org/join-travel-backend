# JoinTravel Backend

Backend for the join travel website.

## Technologies

- Gin-gonic
- Go

## How to run

### Dependencies

- Install golang!
- Intall docker!

### Development

```bash
# Run development instance
go run cmd/main

# Build binary executable
go build cmd/main

# Format code
go fmt ./...
```

### Production

How to use docker to build and run server.

```bash
# Build docker image
docker build -t join-travel-back .

# Run dockerized container
docker run --rm -p <any_port>:8080 join-travel-back:latest

# Cleanup image
docker rmi join-travel-back:latest
```

## Makefile Commands

The project includes a Makefile to simplify common Docker Compose operations. Ensure Docker and Docker Compose are installed.

- `make up`: Starts the application services using Docker Compose. This command builds the images if they don't exist and runs the containers in the background.
- `make down`: Stops and removes the running Docker Compose services, cleaning up containers and networks.

## How to test

Tests should be written in the same package of the tested object, and the package name should be the same but appending `_test`.

```bash
# Run all tests in subdirectories and show coverage
go test ./... -cover
```

## Structure

Se tiene la siguiente estructura base, donde los controladores, servicios y repositorios se ponen en sus correspontientes carpetas
**creado su archivo separado para la interfaz y otro para la implementacion**.

```bash
.
├── cmd # Binary entrypoint
│   └── main.go
├── config # Server/Global config
│   └── config.go
├── Dockerfile
├── go.mod
├── go.sum
├── internal # Server logic packaged by layer
│   ├── controllers
│   ├── repositories
│   ├── router
│   ├── server
│   ├── services
│   └── utils
```

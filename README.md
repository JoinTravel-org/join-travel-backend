# JoinTravel Backend

## Technologies

- Express
- Javascript
- pnpm

## How to run

### Dependencies

Install pnpm.

```bash
npm install -g pnpm
```

Install the needed dependencies.

```bash
pnpm install
```

### Execute

```bash
# Start development environment
pnpm dev

# Start production environment
pnpm start
```

### API Documentation

Once the server is running, you can access the Swagger API documentation at:

```
http://localhost:3005/docs
```

The documentation provides interactive API testing, detailed endpoint descriptions, request/response schemas, and examples for all available endpoints.

## Docker

### Prerequisites

- Docker installed on your system.

### Using Docker Compose and Makefile

Alternatively, you can use Docker Compose for easier management:

```bash
# Start the application (builds and runs the container)
make up

# Stop the application
make down
```

### Manual Docker Commands

If you prefer to use Docker commands directly:

```bash
# Build the image
docker build -t jointravel-back .

# Run the container
docker run -d --name jointravel-back-container -p 8080:8080 jointrave-backt

# Stop the container
docker stop jointravel-back-container
docker rm jointravel-back-container

# Remove the image
docker rmi jointravel-back
```

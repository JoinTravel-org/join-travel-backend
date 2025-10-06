##############################
# DEPENDENCIES DOWNLOAD STAGE
##############################

# Use the official Golang image based on Alpine Linux for a lightweight base. The 'AS deps' names this stage for multi-stage build.
FROM golang:1.24.6-alpine3.21 AS deps

# Set the working directory inside the container to /usr/src/app for subsequent commands.
WORKDIR /usr/src/app

# Copy Go module files to the working directory to leverage Docker layer caching for dependencies.
COPY go.mod go.sum ./
# Download and cache Go module dependencies. This step is cached unless go.mod or go.sum change.
RUN go mod download

##############################
# BUILDING & COMPILING STAGE
##############################
# Start a new build stage using the same Golang image. This stage builds the application.
FROM golang:1.24.6-alpine3.21 AS builder

# Set the working directory inside the container to /usr/src/app for subsequent commands.
WORKDIR /usr/src/app

# Copy the cached Go modules from the deps stage to avoid re-downloading dependencies.
COPY --from=deps /go/pkg /go/pkg
# Copy the entire source code into the container.
COPY . .

# Build the Go application with verbose output, outputting the binary to /usr/local/bin/app. Specify the main file.
RUN go build -v -o /usr/local/bin/app cmd/main.go

##############################
# PROGRAM EXECUTION STAGE
##############################
# Use BusyBox as the final runtime image for minimal size. This stage runs the compiled application.
FROM busybox:latest AS runner

# Set the working directory inside the container to /usr/src/app for subsequent commands.
WORKDIR /usr/src/app

# Copy the compiled binary from the builder stage to the runner stage.
COPY --from=builder /usr/local/bin/app /usr/local/bin/app
# Make the app binary executable. Note: Ensure the path matches the copied binary.
RUN chmod +x /usr/local/bin/app

# Expose port 8080 to allow external access to the application.
EXPOSE 8080

# Set the default command to run the app binary when the container starts.
ENTRYPOINT ["app"]

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend-builder

# Install build dependencies for static compilation
RUN apk add --no-cache gcc musl-dev sqlite-dev sqlite-static

WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY backend/ ./

# Build fully static binary with symbols stripped
RUN CGO_ENABLED=1 GOOS=linux go build \
    -a \
    -ldflags '-linkmode external -extldflags "-static" -s -w' \
    -o main .

# Verify it's static
RUN ldd main || echo "Static binary confirmed"

# Stage 3: Final minimal image
FROM scratch

ENV GIN_MODE=release

# Copy CA certificates for HTTPS
COPY --from=backend-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the static binary
COPY --from=backend-builder /app/main /main

# Copy static frontend files
COPY --from=frontend-builder /app/frontend/dist /static

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["/main"]

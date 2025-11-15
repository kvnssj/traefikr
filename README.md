# Traefikr

<p align="center">
  <img src="frontend/public/traefikr_logo.svg" alt="Traefikr Logo" width="200" height="200">
</p>

<p align="center">
  <strong>A modern, user-friendly configuration management interface for Traefik v3.6</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

Traefikr is a comprehensive REST API and web interface for managing Traefik v3.6 configurations. It provides a clean, intuitive UI for creating and managing routers, services, middlewares, and more, with full JSON schema validation and real-time synchronization with Traefik.

## Features

### 🎯 Core Capabilities

- **Full Resource Management**: Create, read, update, and delete Traefik resources
  - HTTP/TCP/UDP Routers
  - HTTP/TCP/UDP Services
  - HTTP/TCP Middlewares
  - TLS Certificates and Options
  - Server Transports

- **Schema-Driven Forms**: Dynamic forms generated from Traefik v3.6 JSON schemas
  - Real-time validation
  - Inline documentation
  - Type-safe configuration

- **Dual Authentication**
  - JWT-based user authentication for web UI
  - API key authentication for Traefik HTTP provider polling
  - Secure, isolated authentication flows

### 🚀 Technical Highlights

- **Lightweight Backend**: Go-based API with SQLite persistence (~40MB Docker image)
- **Modern Frontend**: React + TypeScript + Mantine UI
- **Unified Container**: Single Docker image with embedded frontend
- **Production Ready**: FROM scratch container, fully static binary
- **Real-time Sync**: Traefik polls `/api/config` for instant updates

### 🔒 Security

- Bcrypt password hashing
- JWT token authentication (24-hour expiry)
- API key-based access control for Traefik
- CORS protection
- Static binary with no external dependencies

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Traefik v3.6 (optional, for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/traefikr.git
   cd traefikr
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Get your admin credentials from the logs:
   ```bash
   docker-compose logs backend | grep "Initial Admin Credentials"
   ```

4. Access the web interface:
   ```
   http://localhost (via Traefik)
   # or
   http://localhost:8000 (direct access)
   ```

### First Login

On first startup, Traefikr creates an admin user with a randomly generated password. Save these credentials immediately—they won't be shown again!

```
==================================================
Initial Admin Credentials
Username: admin
Password: jSmiVnQZ5LL0m-8x
==================================================
```

## Architecture

### System Components

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Traefik   │─────>│   Traefikr   │<─────│   Browser   │
│   (Proxy)   │      │   (Backend)  │      │   (Admin)   │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │
      │                      │
      └──── Polls /api/config (API Key)
                             │
                             └──── JWT Auth (Users)
```

### Backend Structure

- **Go 1.24** with Gin web framework
- **SQLite** for configuration persistence
- **Embedded schemas** for validation (compiled into binary)
- **FROM scratch** Docker image for minimal attack surface

### Frontend Structure

- **React 18** with TypeScript
- **Mantine UI** component library
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Vite** for fast builds

## Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run locally
DB_PATH=./traefikr.db PORT=8080 TRAEFIK_API_URL=http://localhost:8080 ./traefikr

# Build
go build -o traefikr .
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Using Development Compose

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Configuration

### Environment Variables

#### Backend
- `DB_PATH`: SQLite database location (default: `/data/traefikr.db`)
- `TRAEFIKR_PORT`: Server port (default: `8080`)
- `TRAEFIK_API_URL`: Traefik API endpoint (default: `http://traefik:8080`)
- `JWT_SECRET`: JWT signing key (auto-generated if not set)

#### Frontend
- `VITE_TRAEFIKR_API_URL`: API base URL (default: same-origin)

### Traefik Integration

Configure Traefik to poll the Traefikr HTTP provider:

```yaml
# traefik.yml (static configuration)
providers:
  http:
    endpoint: "http://backend:8080/api/config"
    headers:
      x-traefikr-key: "your-api-key-here"  # Optional: only if API keys are configured
    pollInterval: "5s"
```

Create API keys in the Traefikr Settings page.

## API Documentation

### Authentication

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

Returns a JWT token for authenticated requests.

#### API Key (Traefik)
```bash
GET /api/config
x-traefikr-key: your-api-key
```

### Resources

All CRUD operations follow the pattern:
```
GET    /api/{protocol}/{type}                    # List resources
GET    /api/{protocol}/{type}/{name@provider}    # Get resource
POST   /api/{protocol}/{type}                    # Create resource
PUT    /api/{protocol}/{type}/{name@provider}    # Update resource
DELETE /api/{protocol}/{type}/{name@provider}    # Delete resource
```

**Protocols**: `http`, `tcp`, `udp`
**Types**: `routers`, `services`, `middlewares`, `serversTransport`, `tls`

### Example: Create HTTP Router

```bash
curl -X POST http://localhost:8000/api/http/routers \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-router",
    "provider": "http",
    "config": {
      "rule": "Host(`example.com`)",
      "service": "my-service@http",
      "entryPoints": ["web"]
    }
  }'
```

## Testing

```bash
# Test authentication
./tests/test_auth.sh

# Create test resources
./tests/create_fixed_resources.sh

# Create all middleware types
./tests/create_middlewares.sh

# Delete all resources
./tests/delete_all_resources.sh
```

## Project Structure

```
traefikr/
├── backend/
│   ├── handlers/          # HTTP request handlers
│   ├── middleware/        # Authentication middleware
│   ├── models/            # Database models
│   ├── schemas/           # JSON schemas for validation
│   ├── utils/             # Traefik client and utilities
│   ├── main.go            # Entry point
│   └── Dockerfile         # Backend-only build (deprecated)
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React contexts (auth, etc.)
│   │   ├── lib/           # API client and utilities
│   │   └── pages/         # Page components
│   ├── public/            # Static assets
│   └── Dockerfile-dev     # Frontend-only build (dev)
├── tests/                 # Integration tests
├── Dockerfile             # Unified production build
├── docker-compose.yml     # Production compose
└── docker-compose.dev.yml # Development compose
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Roadmap

- [ ] User management UI
- [ ] Configuration import/export
- [ ] Configuration templates
- [ ] Multi-instance Traefik support
- [ ] Metrics and monitoring dashboard
- [ ] Audit logging
- [ ] RBAC (Role-Based Access Control)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Traefik](https://traefik.io/) - The amazing reverse proxy this tool manages
- [Mantine](https://mantine.dev/) - Beautiful React component library
- Go Gopher logo inspiration for our Traefikr mascot

---

<p align="center">
  Made with ❤️ by the Traefikr team
</p>

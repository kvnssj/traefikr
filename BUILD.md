# Build Guide

## Unified Container (Production)

The default setup builds frontend and backend into a single container for production deployment.

### Build and Run

```bash
# Build and start unified container
docker-compose up --build

# Access the application
# UI: http://localhost:8000 or http://manager.localhost (via Traefik)
# API: http://localhost:8000/api or http://api.localhost/api (via Traefik)
# Traefik Dashboard: http://localhost:8080
```

### Architecture

- **Single Container**: Frontend (React) and Backend (Go) in one image
- **Static Files**: Frontend built as static files and embedded in Go binary
- **Routing**:
  - `/api/*` → Backend API endpoints
  - `/health` → Health check
  - `/assets/*` → Static assets (JS, CSS, images)
  - `/`, `/index.html`, `/index.htm` → Frontend index.html
  - All other routes → Frontend index.html (SPA routing)

### How It Works

1. **Stage 1**: Node 20 builds React frontend (`npm run build`)
2. **Stage 2**: Go 1.24 builds backend with frontend embedded
3. **Stage 3**: FROM scratch with static binary (~40MB total)

The frontend static files are embedded using Go's `//go:embed` directive and served via Gin routes.

## Development Setup (Hot Reload)

For active development with hot module replacement (HMR):

```bash
# Use development docker-compose
docker-compose -f docker-compose.dev.yml up --build

# Frontend available at: http://localhost:3000 or http://manager.localhost
# Backend available at: http://localhost:8000 or http://api.localhost
```

### Development Architecture

- **Separate Containers**: Frontend and backend in separate containers
- **Hot Reload**: Frontend changes auto-reload (Vite HMR)
- **Volume Mounts**: Frontend code mounted for live editing
- **Environment Variable**: Frontend configured with `VITE_TRAEFIKR_API_URL=http://localhost:8000`

## Files Changed

### New Files
- `/Dockerfile` - Unified multi-stage build
- `/docker-compose.dev.yml` - Development setup with HMR
- `/.dockerignore` - Optimize build by excluding unnecessary files
- `/BUILD.md` - This file

### Modified Files
- `/docker-compose.yml` - Now uses unified container
- `/backend/main.go` - Added static file serving and embedded FS
- `/frontend/src/lib/api.ts` - Support same-origin API calls

## Environment Variables

### Backend (Production & Development)
- `TRAEFIKR_DB_PATH` - Database location (default: `/data/traefikr.db`)
- `TRAEFIKR_PORT` - Server port (default: `8080`)
- `TRAEFIK_API_URL` - Traefik API endpoint (default: `http://traefik:8080`)
- `JWT_SECRET` - JWT signing key (auto-generated if not set)

### Frontend (Development Only)
- `VITE_TRAEFIKR_API_URL` - Backend API URL (default: same origin)

In production, frontend uses same origin (no CORS needed).

## CORS Configuration

Backend includes permissive CORS middleware:
- **Origins**: `*` (all origins)
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, x-traefikr-key
- **Preflight Cache**: 24 hours

## Binary Size

Production image:
- **Total**: ~40MB
- **Frontend**: ~2-5MB (minified React bundle)
- **Backend**: ~36MB (static Go binary with SQLite)
- **Base**: FROM scratch (0 bytes)

#!/bin/bash

echo "=== Test Query Parameter: traefik=true|false ==="
echo ""

# Login and get JWT token
JWT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"jSmiVnQZ5LL0m-8x"}')
JWT_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.token')

echo "1. List routers (default - only database):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/routers" | jq 'length'

echo ""
echo "2. List routers with traefik=false (only database):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/routers?traefik=false" | jq 'length'

echo ""
echo "3. List routers with traefik=true (database + Traefik):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/routers?traefik=true" | jq 'length'

echo ""
echo "4. List services (default - only database):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/services" | jq 'length'

echo ""
echo "5. List services with traefik=true (database + Traefik):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/services?traefik=true" | jq 'length'

echo ""
echo "6. List middlewares (default - only database):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/middlewares" | jq 'length'

echo ""
echo "7. List middlewares with traefik=true (database + Traefik):"
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:8000/api/http/middlewares?traefik=true" | jq 'length'

echo ""
echo "=== All tests completed ==="

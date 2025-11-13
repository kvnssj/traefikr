#!/bin/bash

echo "=== Test 1: Login with JWT ==="
JWT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"c6WmpvrnGj8ti95w"}')
echo "$JWT_RESPONSE" | jq
JWT_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.token')

echo ""
echo "=== Test 2: Create API key using JWT ==="
API_KEY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/http/provider \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Traefik Polling Key"}')
echo "$API_KEY_RESPONSE" | jq
API_KEY=$(echo "$API_KEY_RESPONSE" | jq -r '.key')

echo ""
echo "=== Test 3: Test /api/config with API key (should work) ==="
curl -s -H "x-auth-key: $API_KEY" http://localhost:8000/api/config | jq

echo ""
echo "=== Test 4: Test /api/config without API key (should fail - API keys exist) ==="
curl -s -w "\nHTTP %{http_code}\n" http://localhost:8000/api/config | head -3

echo ""
echo "=== Test 5: Try CRUD with x-auth-key (should fail - needs JWT) ==="
curl -s -H "x-auth-key: $API_KEY" http://localhost:8000/api/http/routers | jq -r '.error // "SUCCESS"'

echo ""
echo "=== Test 6: Try CRUD with JWT (should work) ==="
curl -s -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8000/api/http/routers | jq 'if type=="array" then "SUCCESS: Got array response" else . end'

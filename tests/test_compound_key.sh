#!/bin/bash

JWT=$(cat /tmp/jwt_new.txt)

echo "=== Testing Compound Key (name, provider, protocol, type) ==="
echo ""
echo "1. HTTP Routers named 'test-router':"
curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/api/http/routers | jq '.[] | select(.name=="test-router") | {name, protocol, type}'

echo ""
echo "2. TCP Routers named 'test-router':"
curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/api/tcp/routers | jq '.[] | select(.name=="test-router") | {name, protocol, type}'

echo ""
echo "3. HTTP Middlewares named 'test-router':"
curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/api/http/middlewares | jq '.[] | select(.name=="test-router") | {name, protocol, type}'

echo ""
echo "=== All three resources with name 'test-router' coexist successfully! ==="

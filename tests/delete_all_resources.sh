#!/bin/bash

API_KEY="sk_S3ZrDip07cbRdr52ceSmdX_ZJx7ni8j0SBoNoWsgxnQ="
BASE_URL="http://localhost:8000/api"

echo "=== Deleting HTTP Routers ==="
curl -s -X DELETE "$BASE_URL/http/routers/Router0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/routers/Router1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting HTTP Services ==="
curl -s -X DELETE "$BASE_URL/http/services/Service01@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/services/Service03@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/services/Service04@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/services/Service05@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting HTTP Middlewares ==="
for i in {01..25}; do
  curl -s -X DELETE "$BASE_URL/http/middlewares/Middleware$i@http" -H "x-auth-key: $API_KEY"
done

echo ""
echo "=== Deleting HTTP ServersTransports ==="
curl -s -X DELETE "$BASE_URL/http/serversTransport/ServersTransport0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/serversTransport/ServersTransport1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting HTTP TLS Options ==="
curl -s -X DELETE "$BASE_URL/http/tls/Options0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/http/tls/Options1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting TCP Routers ==="
curl -s -X DELETE "$BASE_URL/tcp/routers/TCPRouter0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/tcp/routers/TCPRouter1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting TCP Services ==="
curl -s -X DELETE "$BASE_URL/tcp/services/TCPService01@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/tcp/services/TCPService02@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting TCP Middlewares ==="
curl -s -X DELETE "$BASE_URL/tcp/middlewares/TCPMiddleware01@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/tcp/middlewares/TCPMiddleware03@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting TCP ServersTransports ==="
curl -s -X DELETE "$BASE_URL/tcp/serversTransport/TCPServersTransport0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/tcp/serversTransport/TCPServersTransport1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting UDP Routers ==="
curl -s -X DELETE "$BASE_URL/udp/routers/UDPRouter0@http" -H "x-auth-key: $API_KEY"
curl -s -X DELETE "$BASE_URL/udp/routers/UDPRouter1@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Deleting UDP Services ==="
curl -s -X DELETE "$BASE_URL/udp/services/UDPService01@http" -H "x-auth-key: $API_KEY"

echo ""
echo "=== Verification ==="
curl -s http://localhost:8000/api/config | jq '{http: {routers: (.http.routers | keys), services: (.http.services | keys), middlewares: (.http.middlewares | keys), serversTransport: (.http.serversTransport | keys), tls: (.http.tls | keys)}, tcp: {routers: (.tcp.routers | keys), services: (.tcp.services | keys), middlewares: (.tcp.middlewares | keys), serversTransport: (.tcp.serversTransport | keys)}, udp: {routers: (.udp.routers | keys), services: (.udp.services | keys)}}'

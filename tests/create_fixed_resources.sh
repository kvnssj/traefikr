#!/bin/bash

API_KEY="sk_S3ZrDip07cbRdr52ceSmdX_ZJx7ni8j0SBoNoWsgxnQ="
BASE_URL="http://localhost:8000/api"

echo "=== Creating HTTP Routers ==="
curl -s -X POST "$BASE_URL/http/routers" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Router0","config":{"entryPoints":["foobar","foobar"],"middlewares":["foobar","foobar"],"service":"foobar","rule":"foobar","parentRefs":["foobar","foobar"],"priority":42,"tls":{"options":"foobar","certResolver":"foobar","domains":[{"main":"foobar","sans":["foobar","foobar"]},{"main":"foobar","sans":["foobar","foobar"]}]},"observability":{"accessLogs":true,"metrics":true,"tracing":true,"traceVerbosity":"detailed"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/routers" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Router1","config":{"entryPoints":["foobar","foobar"],"middlewares":["foobar","foobar"],"service":"foobar","rule":"foobar","parentRefs":["foobar","foobar"],"priority":42,"tls":{"options":"foobar","certResolver":"foobar","domains":[{"main":"foobar","sans":["foobar","foobar"]},{"main":"foobar","sans":["foobar","foobar"]}]},"observability":{"accessLogs":true,"metrics":true,"tracing":true,"traceVerbosity":"detailed"}}}' | jq -c

echo "=== Creating HTTP Services ==="
curl -s -X POST "$BASE_URL/http/services" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Service03","config":{"loadBalancer":{"sticky":{"cookie":{"name":"foobar","secure":true,"httpOnly":true,"sameSite":"lax","maxAge":42,"path":"foobar","domain":"foobar"}},"servers":[{"url":"foobar","weight":42,"preservePath":true},{"url":"foobar","weight":42,"preservePath":true}],"strategy":"p2c","healthCheck":{"scheme":"foobar","mode":"http","path":"foobar","method":"foobar","status":42,"port":42,"interval":"42s","unhealthyInterval":"42s","timeout":"42s","hostname":"foobar","followRedirects":true,"headers":{"name0":"foobar","name1":"foobar"}},"passiveHealthCheck":{"failureWindow":"42s","maxFailedAttempts":42},"passHostHeader":true,"responseForwarding":{"flushInterval":"42s"},"serversTransport":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/services" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Service05","config":{"weighted":{"services":[{"name":"foobar","weight":42},{"name":"foobar","weight":42}],"sticky":{"cookie":{"name":"foobar","secure":true,"httpOnly":true,"sameSite":"strict","maxAge":42,"path":"foobar","domain":"foobar"}},"healthCheck":{}}}}' | jq -c

echo "=== Creating HTTP Middlewares (simplified - schema has ipStrategy issues) ==="
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware04","config":{"chain":{"middlewares":["foobar","foobar"]}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware05","config":{"circuitBreaker":{"expression":"foobar","checkPeriod":"42s","fallbackDuration":"42s","recoveryDuration":"42s","responseCode":42}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware06","config":{"compress":{"excludedContentTypes":["foobar","foobar"],"includedContentTypes":["foobar","foobar"],"minResponseBodyBytes":42,"encodings":["foobar","foobar"],"defaultEncoding":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware07","config":{"contentType":{"autoDetect":true}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware09","config":{"errors":{"status":["foobar","foobar"],"statusRewrites":{"name0":42,"name1":42},"service":"foobar","query":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware11","config":{"grpcWeb":{"allowOrigins":["foobar","foobar"]}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware19","config":{"redirectRegex":{"regex":"foobar","replacement":"foobar","permanent":true}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware20","config":{"redirectScheme":{"scheme":"foobar","port":"foobar","permanent":true}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware21","config":{"replacePath":{"path":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware22","config":{"replacePathRegex":{"regex":"foobar","replacement":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware23","config":{"retry":{"attempts":42,"initialInterval":"42s"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware24","config":{"stripPrefix":{"prefixes":["foobar","foobar"],"forceSlash":true}}}' | jq -c
curl -s -X POST "$BASE_URL/http/middlewares" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware25","config":{"stripPrefixRegex":{"regex":["foobar","foobar"]}}}' | jq -c

echo "=== Creating HTTP ServersTransports ==="
curl -s -X POST "$BASE_URL/http/serversTransport" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"ServersTransport0","config":{"serverName":"foobar","insecureSkipVerify":true,"rootCAs":["foobar","foobar"],"certificates":["foobar","foobar"],"maxIdleConnsPerHost":42,"forwardingTimeouts":{"dialTimeout":"42s","responseHeaderTimeout":"42s","idleConnTimeout":"42s","readIdleTimeout":"42s","pingTimeout":"42s"},"disableHTTP2":true,"peerCertURI":"foobar","spiffe":{"ids":["foobar","foobar"],"trustDomain":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/http/serversTransport" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"ServersTransport1","config":{"serverName":"foobar","insecureSkipVerify":true,"rootCAs":["foobar","foobar"],"certificates":["foobar","foobar"],"maxIdleConnsPerHost":42,"forwardingTimeouts":{"dialTimeout":"42s","responseHeaderTimeout":"42s","idleConnTimeout":"42s","readIdleTimeout":"42s","pingTimeout":"42s"},"disableHTTP2":true,"peerCertURI":"foobar","spiffe":{"ids":["foobar","foobar"],"trustDomain":"foobar"}}}' | jq -c

echo "=== Creating TCP Routers ==="
curl -s -X POST "$BASE_URL/tcp/routers" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"TCPRouter0","config":{"entryPoints":["foobar","foobar"],"middlewares":["foobar","foobar"],"service":"foobar","rule":"foobar","priority":42,"tls":{"passthrough":true,"options":"foobar","certResolver":"foobar","domains":[{"main":"foobar","sans":["foobar","foobar"]},{"main":"foobar","sans":["foobar","foobar"]}]}}}' | jq -c
curl -s -X POST "$BASE_URL/tcp/routers" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"TCPRouter1","config":{"entryPoints":["foobar","foobar"],"middlewares":["foobar","foobar"],"service":"foobar","rule":"foobar","priority":42,"tls":{"passthrough":true,"options":"foobar","certResolver":"foobar","domains":[{"main":"foobar","sans":["foobar","foobar"]},{"main":"foobar","sans":["foobar","foobar"]}]}}}' | jq -c

echo "=== Creating TCP Services ==="
curl -s -X POST "$BASE_URL/tcp/services" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"TCPService01","config":{"loadBalancer":{"servers":[{"address":"foobar","tls":true},{"address":"foobar","tls":true}],"serversTransport":"foobar","proxyProtocol":{"version":2},"terminationDelay":42,"healthCheck":{"port":42,"send":"foobar","expect":"foobar","interval":"42s","unhealthyInterval":"42s","timeout":"42s"}}}}' | jq -c

echo "=== Creating TCP ServersTransports ==="
curl -s -X POST "$BASE_URL/tcp/serversTransport" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"TCPServersTransport0","config":{"dialKeepAlive":"42s","dialTimeout":"42s","proxyProtocol":{"version":1},"terminationDelay":"42s","tls":{"serverName":"foobar","insecureSkipVerify":true,"rootCAs":["foobar","foobar"],"certificates":["foobar","foobar"],"peerCertURI":"foobar"}}}' | jq -c
curl -s -X POST "$BASE_URL/tcp/serversTransport" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"TCPServersTransport1","config":{"dialKeepAlive":"42s","dialTimeout":"42s","proxyProtocol":{"version":2},"terminationDelay":"42s","tls":{"serverName":"foobar","insecureSkipVerify":true,"rootCAs":["foobar","foobar"],"certificates":["foobar","foobar"],"peerCertURI":"foobar"}}}' | jq -c

echo "=== Creating HTTP TLS Options ==="
curl -s -X POST "$BASE_URL/http/tls" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Options0","config":{"minVersion":"VersionTLS12","maxVersion":"VersionTLS13","cipherSuites":["foobar","foobar"],"curvePreferences":["CurveP256","X25519"],"clientAuth":{"caFiles":["foobar","foobar"],"clientAuthType":"RequireAndVerifyClientCert"},"sniStrict":true,"alpnProtocols":["foobar","foobar"],"disableSessionTickets":true}}' | jq -c
curl -s -X POST "$BASE_URL/http/tls" -H "x-auth-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Options1","config":{"minVersion":"VersionTLS12","maxVersion":"VersionTLS13","cipherSuites":["foobar","foobar"],"curvePreferences":["secp256r1","secp384r1"],"clientAuth":{"caFiles":["foobar","foobar"],"clientAuthType":"VerifyClientCertIfGiven"},"sniStrict":true,"alpnProtocols":["foobar","foobar"],"disableSessionTickets":true}}' | jq -c

echo ""
echo "=== Verification ==="
echo "HTTP Routers:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/http/routers" | jq '[.[] | select(.provider == "http")] | length'
echo "HTTP Services:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/http/services" | jq '[.[] | select(.provider == "http")] | length'
echo "HTTP Middlewares:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/http/middlewares" | jq '[.[] | select(.provider == "http")] | length'
echo "HTTP ServersTransports:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/http/serversTransport" | jq '[.[] | select(.provider == "http")] | length'
echo "TCP Routers:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/tcp/routers" | jq '[.[] | select(.provider == "http")] | length'
echo "TCP Services:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/tcp/services" | jq '[.[] | select(.provider == "http")] | length'
echo "TCP Middlewares:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/tcp/middlewares" | jq '[.[] | select(.provider == "http")] | length'
echo "TCP ServersTransports:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/tcp/serversTransport" | jq '[.[] | select(.provider == "http")] | length'
echo "UDP Routers:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/udp/routers" | jq '[.[] | select(.provider == "http")] | length'
echo "UDP Services:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/udp/services" | jq '[.[] | select(.provider == "http")] | length'
echo "HTTP TLS:"
curl -s -H "x-auth-key: $API_KEY" "$BASE_URL/http/tls" | jq '[.[] | select(.provider == "http")] | length'

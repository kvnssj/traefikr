#!/bin/bash

API_KEY="sk_S3ZrDip07cbRdr52ceSmdX_ZJx7ni8j0SBoNoWsgxnQ="
BASE_URL="http://localhost:8000/api"

# HTTP Routers
curl -X POST "$BASE_URL/http/routers" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Router0",
    "config": {
      "entryPoints": ["foobar", "foobar"],
      "middlewares": ["foobar", "foobar"],
      "service": "foobar",
      "rule": "foobar",
      "parentRefs": ["foobar", "foobar"],
      "ruleSyntax": "foobar",
      "priority": 42,
      "tls": {
        "options": "foobar",
        "certResolver": "foobar",
        "domains": [
          {"main": "foobar", "sans": ["foobar", "foobar"]},
          {"main": "foobar", "sans": ["foobar", "foobar"]}
        ]
      },
      "observability": {
        "accessLogs": true,
        "metrics": true,
        "tracing": true,
        "traceVerbosity": "foobar"
      }
    }
  }'

curl -X POST "$BASE_URL/http/routers" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Router1",
    "config": {
      "entryPoints": ["foobar", "foobar"],
      "middlewares": ["foobar", "foobar"],
      "service": "foobar",
      "rule": "foobar",
      "parentRefs": ["foobar", "foobar"],
      "ruleSyntax": "foobar",
      "priority": 42,
      "tls": {
        "options": "foobar",
        "certResolver": "foobar",
        "domains": [
          {"main": "foobar", "sans": ["foobar", "foobar"]},
          {"main": "foobar", "sans": ["foobar", "foobar"]}
        ]
      },
      "observability": {
        "accessLogs": true,
        "metrics": true,
        "tracing": true,
        "traceVerbosity": "foobar"
      }
    }
  }'

# HTTP Services
curl -X POST "$BASE_URL/http/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service01",
    "config": {
      "failover": {
        "service": "foobar",
        "fallback": "foobar",
        "healthCheck": {}
      }
    }
  }'

curl -X POST "$BASE_URL/http/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service02",
    "config": {
      "highestRandomWeight": {
        "services": [
          {"name": "foobar", "weight": 42},
          {"name": "foobar", "weight": 42}
        ],
        "healthCheck": {}
      }
    }
  }'

curl -X POST "$BASE_URL/http/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service03",
    "config": {
      "loadBalancer": {
        "sticky": {
          "cookie": {
            "name": "foobar",
            "secure": true,
            "httpOnly": true,
            "sameSite": "foobar",
            "maxAge": 42,
            "path": "foobar",
            "domain": "foobar"
          }
        },
        "servers": [
          {"url": "foobar", "weight": 42, "preservePath": true},
          {"url": "foobar", "weight": 42, "preservePath": true}
        ],
        "strategy": "foobar",
        "healthCheck": {
          "scheme": "foobar",
          "mode": "foobar",
          "path": "foobar",
          "method": "foobar",
          "status": 42,
          "port": 42,
          "interval": "42s",
          "unhealthyInterval": "42s",
          "timeout": "42s",
          "hostname": "foobar",
          "followRedirects": true,
          "headers": {"name0": "foobar", "name1": "foobar"}
        },
        "passiveHealthCheck": {
          "failureWindow": "42s",
          "maxFailedAttempts": 42
        },
        "passHostHeader": true,
        "responseForwarding": {"flushInterval": "42s"},
        "serversTransport": "foobar"
      }
    }
  }'

curl -X POST "$BASE_URL/http/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service04",
    "config": {
      "mirroring": {
        "service": "foobar",
        "mirrorBody": true,
        "maxBodySize": 42,
        "mirrors": [
          {"name": "foobar", "percent": 42},
          {"name": "foobar", "percent": 42}
        ],
        "healthCheck": {}
      }
    }
  }'

curl -X POST "$BASE_URL/http/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service05",
    "config": {
      "weighted": {
        "services": [
          {"name": "foobar", "weight": 42},
          {"name": "foobar", "weight": 42}
        ],
        "sticky": {
          "cookie": {
            "name": "foobar",
            "secure": true,
            "httpOnly": true,
            "sameSite": "foobar",
            "maxAge": 42,
            "path": "foobar",
            "domain": "foobar"
          }
        },
        "healthCheck": {}
      }
    }
  }'

# HTTP Middlewares (I'll create a few key ones, all 25 would be very long)
curl -X POST "$BASE_URL/http/middlewares" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Middleware01",
    "config": {"addPrefix": {"prefix": "foobar"}}
  }'

curl -X POST "$BASE_URL/http/middlewares" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Middleware02",
    "config": {
      "basicAuth": {
        "users": ["foobar", "foobar"],
        "usersFile": "foobar",
        "realm": "foobar",
        "removeHeader": true,
        "headerField": "foobar"
      }
    }
  }'

curl -X POST "$BASE_URL/http/middlewares" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Middleware03",
    "config": {
      "buffering": {
        "maxRequestBodyBytes": 42,
        "memRequestBodyBytes": 42,
        "maxResponseBodyBytes": 42,
        "memResponseBodyBytes": 42,
        "retryExpression": "foobar"
      }
    }
  }'

# HTTP ServersTransports
curl -X POST "$BASE_URL/http/serversTransport" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ServersTransport0",
    "config": {
      "serverName": "foobar",
      "insecureSkipVerify": true,
      "rootCAs": ["foobar", "foobar"],
      "certificates": [
        {"certFile": "foobar", "keyFile": "foobar"},
        {"certFile": "foobar", "keyFile": "foobar"}
      ],
      "maxIdleConnsPerHost": 42,
      "forwardingTimeouts": {
        "dialTimeout": "42s",
        "responseHeaderTimeout": "42s",
        "idleConnTimeout": "42s",
        "readIdleTimeout": "42s",
        "pingTimeout": "42s"
      },
      "disableHTTP2": true,
      "peerCertURI": "foobar",
      "spiffe": {
        "ids": ["foobar", "foobar"],
        "trustDomain": "foobar"
      }
    }
  }'

# TCP Routers
curl -X POST "$BASE_URL/tcp/routers" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TCPRouter0",
    "config": {
      "entryPoints": ["foobar", "foobar"],
      "middlewares": ["foobar", "foobar"],
      "service": "foobar",
      "rule": "foobar",
      "ruleSyntax": "foobar",
      "priority": 42,
      "tls": {
        "passthrough": true,
        "options": "foobar",
        "certResolver": "foobar",
        "domains": [
          {"main": "foobar", "sans": ["foobar", "foobar"]},
          {"main": "foobar", "sans": ["foobar", "foobar"]}
        ]
      }
    }
  }'

# TCP Services
curl -X POST "$BASE_URL/tcp/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TCPService01",
    "config": {
      "loadBalancer": {
        "servers": [
          {"address": "foobar", "tls": true},
          {"address": "foobar", "tls": true}
        ],
        "serversTransport": "foobar",
        "proxyProtocol": {"version": 42},
        "terminationDelay": 42,
        "healthCheck": {
          "port": 42,
          "send": "foobar",
          "expect": "foobar",
          "interval": "42s",
          "unhealthyInterval": "42s",
          "timeout": "42s"
        }
      }
    }
  }'

# TCP Middlewares
curl -X POST "$BASE_URL/tcp/middlewares" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TCPMiddleware01",
    "config": {
      "ipAllowList": {
        "sourceRange": ["foobar", "foobar"]
      }
    }
  }'

# UDP Routers
curl -X POST "$BASE_URL/udp/routers" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UDPRouter0",
    "config": {
      "entryPoints": ["foobar", "foobar"],
      "service": "foobar"
    }
  }'

# UDP Services
curl -X POST "$BASE_URL/udp/services" \
  -H "x-traefikr-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UDPService01",
    "config": {
      "loadBalancer": {
        "servers": [
          {"address": "foobar"},
          {"address": "foobar"}
        ]
      }
    }
  }'

echo "All resources created!"

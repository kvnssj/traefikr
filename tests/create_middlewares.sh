#!/bin/bash

API_KEY="sk_S3ZrDip07cbRdr52ceSmdX_ZJx7ni8j0SBoNoWsgxnQ="
BASE_URL="http://localhost:8000/api"

echo "Creating all 25 HTTP Middlewares..."

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware01","config":{"addPrefix":{"prefix":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware02","config":{"basicAuth":{"users":["foobar","foobar"],"usersFile":"foobar","realm":"foobar","removeHeader":true,"headerField":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware03","config":{"buffering":{"maxRequestBodyBytes":42,"memRequestBodyBytes":42,"maxResponseBodyBytes":42,"memResponseBodyBytes":42,"retryExpression":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware04","config":{"chain":{"middlewares":["foobar","foobar"]}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware05","config":{"circuitBreaker":{"expression":"foobar","checkPeriod":"42s","fallbackDuration":"42s","recoveryDuration":"42s","responseCode":42}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware06","config":{"compress":{"excludedContentTypes":["foobar","foobar"],"includedContentTypes":["foobar","foobar"],"minResponseBodyBytes":42,"encodings":["foobar","foobar"],"defaultEncoding":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware07","config":{"contentType":{"autoDetect":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware08","config":{"digestAuth":{"users":["foobar","foobar"],"usersFile":"foobar","removeHeader":true,"realm":"foobar","headerField":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware09","config":{"errors":{"status":["foobar","foobar"],"statusRewrites":{"name0":42,"name1":42},"service":"foobar","query":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware10","config":{"forwardAuth":{"address":"foobar","tls":{"ca":"foobar","cert":"foobar","key":"foobar","insecureSkipVerify":true,"caOptional":true},"trustForwardHeader":true,"authResponseHeaders":["foobar","foobar"],"authResponseHeadersRegex":"foobar","authRequestHeaders":["foobar","foobar"],"addAuthCookiesToResponse":["foobar","foobar"],"headerField":"foobar","forwardBody":true,"maxBodySize":42,"preserveLocationHeader":true,"preserveRequestMethod":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware11","config":{"grpcWeb":{"allowOrigins":["foobar","foobar"]}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware12","config":{"headers":{"customRequestHeaders":{"name0":"foobar","name1":"foobar"},"customResponseHeaders":{"name0":"foobar","name1":"foobar"},"accessControlAllowCredentials":true,"accessControlAllowHeaders":["foobar","foobar"],"accessControlAllowMethods":["foobar","foobar"],"accessControlAllowOriginList":["foobar","foobar"],"accessControlAllowOriginListRegex":["foobar","foobar"],"accessControlExposeHeaders":["foobar","foobar"],"accessControlMaxAge":42,"addVaryHeader":true,"allowedHosts":["foobar","foobar"],"hostsProxyHeaders":["foobar","foobar"],"sslProxyHeaders":{"name0":"foobar","name1":"foobar"},"stsSeconds":42,"stsIncludeSubdomains":true,"stsPreload":true,"forceSTSHeader":true,"frameDeny":true,"customFrameOptionsValue":"foobar","contentTypeNosniff":true,"browserXssFilter":true,"customBrowserXSSValue":"foobar","contentSecurityPolicy":"foobar","contentSecurityPolicyReportOnly":"foobar","publicKey":"foobar","referrerPolicy":"foobar","permissionsPolicy":"foobar","isDevelopment":true,"featurePolicy":"foobar","sslRedirect":true,"sslTemporaryRedirect":true,"sslHost":"foobar","sslForceHost":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware13","config":{"ipAllowList":{"sourceRange":["foobar","foobar"],"ipStrategy":{"depth":42,"excludedIPs":["foobar","foobar"],"ipv6Subnet":42},"rejectStatusCode":42}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware14","config":{"ipWhiteList":{"sourceRange":["foobar","foobar"],"ipStrategy":{"depth":42,"excludedIPs":["foobar","foobar"],"ipv6Subnet":42}}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware15","config":{"inFlightReq":{"amount":42,"sourceCriterion":{"ipStrategy":{"depth":42,"excludedIPs":["foobar","foobar"],"ipv6Subnet":42},"requestHeaderName":"foobar","requestHost":true}}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware16","config":{"passTLSClientCert":{"pem":true,"info":{"notAfter":true,"notBefore":true,"sans":true,"serialNumber":true,"subject":{"country":true,"province":true,"locality":true,"organization":true,"organizationalUnit":true,"commonName":true,"serialNumber":true,"domainComponent":true},"issuer":{"country":true,"province":true,"locality":true,"organization":true,"commonName":true,"serialNumber":true,"domainComponent":true}}}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware17","config":{"plugin":{"PluginConf0":{"name0":"foobar","name1":"foobar"},"PluginConf1":{"name0":"foobar","name1":"foobar"}}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware18","config":{"rateLimit":{"average":42,"period":"42s","burst":42,"sourceCriterion":{"ipStrategy":{"depth":42,"excludedIPs":["foobar","foobar"],"ipv6Subnet":42},"requestHeaderName":"foobar","requestHost":true},"redis":{"endpoints":["foobar","foobar"],"tls":{"ca":"foobar","cert":"foobar","key":"foobar","insecureSkipVerify":true},"username":"foobar","password":"foobar","db":42,"poolSize":42,"minIdleConns":42,"maxActiveConns":42,"readTimeout":"42s","writeTimeout":"42s","dialTimeout":"42s"}}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware19","config":{"redirectRegex":{"regex":"foobar","replacement":"foobar","permanent":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware20","config":{"redirectScheme":{"scheme":"foobar","port":"foobar","permanent":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware21","config":{"replacePath":{"path":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware22","config":{"replacePathRegex":{"regex":"foobar","replacement":"foobar"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware23","config":{"retry":{"attempts":42,"initialInterval":"42s"}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware24","config":{"stripPrefix":{"prefixes":["foobar","foobar"],"forceSlash":true}}}' | jq -c '.name // .error'

curl -s -X POST "$BASE_URL/http/middlewares" -H "x-traefikr-key: $API_KEY" -H "Content-Type: application/json" -d '{"name":"Middleware25","config":{"stripPrefixRegex":{"regex":["foobar","foobar"]}}}' | jq -c '.name // .error'

echo ""
echo "Verifying count:"
curl -s -H "x-traefikr-key: $API_KEY" "$BASE_URL/http/middlewares" | jq '[.[] | select(.provider == "http")] | length'

# ext-auth-service

External Authentication Service for [Higress](https://higress.ai) API Gateway.

This service implements the HTTP endpoint consumed by Higress's `ext-auth` WasmPlugin
(`forward_auth` mode). It validates `Authorization: Bearer <token>` headers and returns
user identity information to the gateway on success.

## Architecture

```
Client ──▶ Higress Gateway ──▶ ext-auth-service (/auth)
                │                       │
                │  200 + x-user-id      │  validate token
                │◀──────────────────────│
                │
                ▼ (authenticated)
           mcp-service
```

## Environment Variables

| Variable       | Default | Description                                                        |
|----------------|---------|--------------------------------------------------------------------|
| `PORT`         | `8090`  | HTTP port the service listens on                                   |
| `HOST`         | `0.0.0.0` | Bind address                                                    |
| `VALID_TOKENS` | *(none)*| Comma-separated `token:user_id` pairs, e.g. `tok1:user1,tok2:user2` |
| `LOG_LEVEL`    | `info`  | Pino log level (`trace`, `debug`, `info`, `warn`, `error`)         |
| `NODE_ENV`     | —       | Set to `production` to disable pretty-print logs                   |

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
export VALID_TOKENS="my-secret-token-001:user_001,my-secret-token-002:user_002"

# 3. Run in dev mode (ts-node)
npm run dev
```

Test the auth endpoint:

```bash
# Should return 200
curl -i -X POST http://localhost:8090/auth \
  -H "Authorization: Bearer my-secret-token-001"

# Should return 403
curl -i -X POST http://localhost:8090/auth \
  -H "Authorization: Bearer invalid-token"

# Should return 401
curl -i -X POST http://localhost:8090/auth
```

## Docker Build

```bash
# Build image
docker build -t mandyl/ext-auth-service:latest .

# Run container
docker run -p 8090:8090 \
  -e VALID_TOKENS="my-secret-token-001:user_001" \
  mandyl/ext-auth-service:latest
```

## Kubernetes Deployment

```bash
# Create namespace (if not exists)
kubectl apply -f deploy/k8s/namespace.yaml

# Deploy ConfigMap (edit tokens first!)
kubectl apply -f deploy/k8s/configmap.yaml

# Deploy service and workload
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml

# Verify
kubectl get pods -n backend -l app=ext-auth-service
kubectl logs -n backend -l app=ext-auth-service
```

## API Reference

### `POST /auth`

Validates the `Authorization` request header.

**Request headers (forwarded by Higress):**

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <token>` |
| `X-Forwarded-*` | No | Original request metadata (forward_auth mode) |

**Responses:**

| Status | Meaning | Response Headers |
|--------|---------|-----------------|
| `200 OK` | Authenticated | `x-user-id: <user_id>`, `x-auth-version: 1.0` |
| `401 Unauthorized` | Missing/malformed token | `x-auth-error: missing_or_invalid_format`, `WWW-Authenticate` |
| `403 Forbidden` | Unknown token | `x-auth-error: token_not_found` |

### `GET /health`

Liveness/readiness probe.

```json
{ "status": "ok", "timestamp": "2026-03-06T12:00:00.000Z" }
```

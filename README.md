# ext-auth-service

外部认证服务，为 Higress ext-auth 插件提供 HTTP 认证接口。

## 功能

- 接收 Higress ext-auth 插件转发的认证请求（`POST /auth`）
- 从 Kubernetes ConfigMap 加载有效 token 列表
- 校验 `Authorization: Bearer <token>` 请求头
  - 认证通过：返回 `200 OK`，附带 `x-user-id` 响应头
  - 格式错误 / 缺失：返回 `401 Unauthorized`
  - Token 无效或过期：返回 `403 Forbidden`
- 提供健康检查接口（`GET /health`）

## 快速开始

### 本地运行

```bash
# 设置环境变量（可选，有默认值）
export PORT=8090
export TOKEN_CONFIG_PATH=./testdata/tokens.yaml

go run ./cmd/server
```

### Docker 构建

```bash
docker build -t mandyl/ext-auth-service:latest .
```

### Kubernetes 部署

```bash
kubectl create namespace backend
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml
```

## 配置

Token 配置通过 ConfigMap 挂载到 `/etc/ext-auth/tokens.yaml`，格式：

```yaml
tokens:
  - value: "my-secret-token-001"
    user_id: "user_001"
    description: "描述"
    expires_at: 0   # 0 = 永不过期，否则为 Unix 时间戳（秒）
```

## API

### POST /auth

认证接口，由 Higress ext-auth 插件调用。

| 请求头           | 说明                              |
|-----------------|-----------------------------------|
| Authorization   | `Bearer <token>`，必填             |

| 响应码 | 含义          | 响应头                                         |
|--------|---------------|------------------------------------------------|
| 200    | 认证通过       | `x-user-id: <user_id>`, `x-auth-version: 1.0` |
| 401    | 缺失或格式错误  | `x-auth-error: missing_or_invalid_token`       |
| 403    | Token 无效/过期 | `x-auth-error: token_expired_or_not_found`    |

### GET /health

健康检查，返回 `{"status":"ok"}`。

## 环境变量

| 变量               | 默认值                      | 说明                   |
|-------------------|-----------------------------|------------------------|
| `PORT`            | `8090`                      | 服务监听端口            |
| `TOKEN_CONFIG_PATH` | `/etc/ext-auth/tokens.yaml` | Token 配置文件路径      |

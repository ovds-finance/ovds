# 09 — API Design

## 1. Base URL

```
https://api.vat-saas.com/v1
```

## 2. Versioning

- Path-based: `/v1/`, `/v2/`
- Breaking changes require a new major version.
- Minor versions are additive only (new endpoints, new optional fields).

## 3. Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

Organization context via header:

```
X-Organization-ID: <organization-uuid>
```

## 4. Standard Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  },
  "links": {
    "self": "/vat-returns?page=1",
    "next": "/vat-returns?page=2",
    "last": "/vat-returns?page=8"
  },
  "requestId": "req_abc123"
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "periodStart", "message": "Period start is required" }
    ]
  },
  "requestId": "req_abc123"
}
```

## 5. Pagination

Cursor-based for large datasets (transactions), offset-based for admin:

```
GET /vat-returns?cursor=eyJpZCI6ICIxMjM0NSJ9&limit=20
GET /vat-returns?page=2&limit=20
```

## 6. Filtering

```
GET /vat-returns?status=submitted&periodStart=2024-01-01&periodEnd=2024-03-31&vatRegistrationId=reg_123
```

## 7. Sorting

```
GET /vat-returns?sort=-createdAt,periodStart
```

Prefix `-` for descending.

## 8. Field Selection

```
GET /vat-returns?fields=id,status,periodStart,periodEnd,netVatDue
```

## 9. Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696521600
```

HTTP 429 with `Retry-After` header on limit exceeded.

## 10. Idempotency

Mutating endpoints support `Idempotency-Key` header:

```
POST /vat-returns
Idempotency-Key: <uuid>
```

Duplicate keys within 24h return the original response.

## 11. Webhooks

Organizations register webhook URLs. Payloads include HMAC signature:

```
POST https://example.com/webhooks
X-Signature: sha256=<hmac>
X-Event-Type: return.submitted
```

## 12. OpenAPI

All endpoints documented with Swagger/OpenAPI 3.1 at `/api/docs`.

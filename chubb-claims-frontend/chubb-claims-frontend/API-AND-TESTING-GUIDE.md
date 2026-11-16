# Chubb Claims — API and Manual Testing Guide

## Service URLs

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`
- Swagger UI, if enabled: `http://localhost:8080/swagger-ui/index.html`

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Claimant | claimant@chubb.test | Claimant@123 |
| Officer | officer@chubb.test | Officer@123 |
| Manager | manager@chubb.test | Manager@123 |

## Endpoints

| Method | URL | Role |
|---|---|---|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/claims` | Claimant, Officer, Manager |
| GET | `/api/v1/claims` | Claimant, Officer, Manager |
| GET | `/api/v1/claims/{id}` | Claimant, Officer, Manager |
| PATCH | `/api/v1/claims/{id}/assignment` | Officer, Manager |
| PATCH | `/api/v1/claims/{id}/status?status={status}` | Officer, Manager |
| POST | `/api/v1/claims/{id}/decision` | Officer, Manager |

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "username": "officer@chubb.test",
  "password": "Officer@123"
}
```

Use the returned `accessToken` in:

```http
Authorization: Bearer <accessToken>
```

## Submit claim

```http
POST /api/v1/claims
Content-Type: application/json
Authorization: Bearer <JWT>
```

```json
{
  "claimantName": "Alex Tan",
  "claimantEmail": "alex.tan@example.com",
  "claimType": "MOTOR",
  "market": "SG",
  "incidentDescription": "Vehicle was damaged in a road accident.",
  "estimatedLoss": 5000.00
}
```

Expected successful response: `201 Created`. Save the returned claim `id`.

## List and retrieve

```http
GET /api/v1/claims?page=0&size=20
GET /api/v1/claims?status=SUBMITTED
GET /api/v1/claims/{claimId}
```

## Assign claim

```http
PATCH /api/v1/claims/{claimId}/assignment
Content-Type: application/json
Authorization: Bearer <OFFICER_JWT>
```

```json
{
  "officer": "officer@chubb.test"
}
```

## Update status

```http
PATCH /api/v1/claims/{claimId}/status?status=UNDER_REVIEW
Authorization: Bearer <OFFICER_JWT>
```

This endpoint does not require a JSON body.

## Approve / reject

```http
POST /api/v1/claims/{claimId}/decision
Content-Type: application/json
Authorization: Bearer <OFFICER_JWT>
```

```json
{
  "outcome": "APPROVED",
  "reason": "Evidence reviewed and claim approved."
}
```

For rejection, set `outcome` to `REJECTED` and supply the reason.

## Valid lifecycle transitions

- `SUBMITTED` → `UNDER_REVIEW`
- `UNDER_REVIEW` → `AWAITING_INFORMATION`
- `AWAITING_INFORMATION` → `UNDER_REVIEW`
- `UNDER_REVIEW` → `APPROVED` or `REJECTED` by the decision endpoint
- `APPROVED` → `SETTLED`
- `REJECTED` and `SETTLED` are terminal

## End-to-end test

1. Login as claimant.
2. Submit a valid claim and save its ID.
3. Verify the claim in the dashboard and detail view.
4. Login as officer.
5. Assign the claim to `officer@chubb.test`.
6. Change status to `UNDER_REVIEW`.
7. Approve or reject with a reason.
8. If approved, update status to `SETTLED`.
9. Refresh the claim detail and confirm the final state.

## Expected authorization tests

- Claimant calls assignment or decision: `403 Forbidden`.
- Officer or manager calls staff endpoints: allowed, if payload and lifecycle state are valid.
- Missing or invalid JWT: request is rejected by backend authentication.
- Invalid lifecycle transition: backend returns a conflict response.

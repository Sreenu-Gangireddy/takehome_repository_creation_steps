# Chubb Claims Frontend

Angular frontend for the Chubb APAC Claims Management assessment. The UI connects to the Spring Boot backend running at `http://localhost:8080`.

## Features

- JWT login for Claimant, Claims Officer and Manager demo users.
- Claims dashboard with status filtering.
- New motor/property claim submission.
- Claim detail view and lifecycle timeline.
- Officer assignment.
- Claim status progression.
- Approval/rejection decision form.
- HTTP interceptor that sends the JWT bearer token with protected API requests.
- Angular development proxy that forwards `/api` requests to the Spring Boot backend.

## Prerequisites

- Node.js version supported by the Angular CLI in `package.json` (use a supported even-numbered LTS release; do not use odd-numbered Node 23).
- npm.
- Spring Boot backend running on port `8080`.
- PostgreSQL and Kafka running if required by the backend.

Check versions:

```cmd
node -v
npm -v
```

Angular compatibility reference: https://angular.dev/reference/versions

## Run on Windows

Open Command Prompt in the folder containing `package.json`:

```cmd
cd /d D:\chubb-claims-frontend\chubb-claims-frontend
dir package.json
```

If `package.json` is not found, you are in the wrong folder. Navigate to the folder that actually contains it.

Install packages:

```cmd
npm install
```

Start the Angular development server:

```cmd
npm start
```

Open the UI:

```text
http://localhost:4200
```

Keep the Spring Boot API running separately:

```text
http://localhost:8080
```

The root `proxy.conf.json` forwards `/api` requests to `http://localhost:8080`.

Build:

```cmd
npm run build
```

## Demo login accounts

These accounts are defined in the backend's in-memory `SecurityConfig`. They are not PostgreSQL users.

| Role | Username | Password |
|---|---|---|
| Claimant | `claimant@chubb.test` | `Claimant@123` |
| Claims Officer | `officer@chubb.test` | `Officer@123` |
| Manager | `manager@chubb.test` | `Manager@123` |

The login page has **Use account** links to pre-fill each demo account.

## API endpoints used by this frontend

Base API URL: `http://localhost:8080`

| Method | Endpoint | Purpose | Role |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Login and obtain JWT | Public |
| POST | `/api/v1/claims` | Submit claim | CLAIMANT, OFFICER, MANAGER |
| GET | `/api/v1/claims` | List claims with paging/status filter | CLAIMANT, OFFICER, MANAGER |
| GET | `/api/v1/claims/{id}` | Get claim details | CLAIMANT, OFFICER, MANAGER |
| PATCH | `/api/v1/claims/{id}/assignment` | Assign claim to officer | OFFICER, MANAGER |
| PATCH | `/api/v1/claims/{id}/status?status=UNDER_REVIEW` | Change claim status | OFFICER, MANAGER |
| POST | `/api/v1/claims/{id}/decision` | Approve or reject claim | OFFICER, MANAGER |

After login, the backend returns `accessToken`. Send it with protected endpoints:

```http
Authorization: Bearer <accessToken>
```

## Claimant workflow

1. Sign in as `claimant@chubb.test`.
2. Open **New claim**.
3. Enter claimant name and valid email address.
4. Select `MOTOR` or `PROPERTY`.
5. Select a two-character uppercase market code such as `SG`, `AU`, `IN`, `HK`, `MY` or `TH`.
6. Enter the incident description (maximum 2,000 characters).
7. Enter estimated loss greater than zero.
8. Submit and open the created claim.

Example request:

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

## Claims officer workflow

1. Sign out and sign in as `officer@chubb.test`.
2. Open a claim from the dashboard.
3. Assign an officer email, for example `officer@chubb.test`.
4. Select the next allowed status and click **Update status**.
5. When status is `UNDER_REVIEW`, use the decision form to approve or reject the claim with a reason.
6. If approved, move the claim to `SETTLED`.

### Update status endpoint

For a submitted claim, select `UNDER_REVIEW` in the **Next status** dropdown. The frontend calls:

```http
PATCH /api/v1/claims/{claimId}/status?status=UNDER_REVIEW
Authorization: Bearer <JWT>
```

No request body is sent; the new status is a query parameter.

## Valid status transitions

| Current status | Allowed next status |
|---|---|
| `SUBMITTED` | `UNDER_REVIEW` |
| `UNDER_REVIEW` | `AWAITING_INFORMATION` |
| `AWAITING_INFORMATION` | `UNDER_REVIEW` |
| `APPROVED` | `SETTLED` |
| `REJECTED` | Terminal state |
| `SETTLED` | Terminal state |

Approval and rejection from `UNDER_REVIEW` use the separate decision endpoint:

```json
{
  "outcome": "APPROVED",
  "reason": "Evidence reviewed and claim approved."
}
```

## Manual test checklist

| # | Scenario | Expected result |
|---:|---|---|
| 1 | Login with claimant credentials | Dashboard opens |
| 2 | Login with invalid password | Login is rejected |
| 3 | Submit valid claim | HTTP 201; claim detail opens |
| 4 | Submit without claimant name | Frontend validation blocks request |
| 5 | Submit invalid email | Frontend validation blocks request |
| 6 | Submit with invalid market code | Backend validation rejects request |
| 7 | List claims | Claims table is displayed |
| 8 | Open claim detail | Claim data and status timeline display |
| 9 | Assign officer as officer | Assignment is saved |
| 10 | Assign officer as claimant | Backend returns 403 |
| 11 | Move SUBMITTED to UNDER_REVIEW | Status is updated |
| 12 | Try invalid lifecycle transition | Backend rejects the transition |
| 13 | Approve UNDER_REVIEW claim | Status becomes APPROVED and reason is saved |
| 14 | Reject UNDER_REVIEW claim | Status becomes REJECTED and reason is saved |
| 15 | Move APPROVED to SETTLED | Status becomes SETTLED |
| 16 | Call protected endpoint without token | Backend denies access |
| 17 | Stop backend and refresh dashboard | Frontend displays connection error |

## Troubleshooting

### `npm` cannot find `package.json`

Run npm commands only in the folder that contains `package.json`:

```cmd
cd /d D:\chubb-claims-frontend\chubb-claims-frontend
dir package.json
npm install
npm start
```

### TypeScript `TS5101` mentions `baseUrl`

Open the frontend root `tsconfig.json` and remove the deprecated `"baseUrl": "./"` option if present. Do not edit files inside `node_modules`.

### Proxy or connection error

- Make sure Spring Boot is running on port `8080`.
- Confirm `proxy.conf.json` targets `http://localhost:8080`.
- Restart `npm start` after changing the proxy.

### 403 Forbidden

- Confirm you are logged in and a JWT is attached.
- Claimant users cannot perform staff actions.
- Use the officer or manager demo account for assignment, status changes and decisions.

### Status update does not work

- Select a value from **Next status** before clicking **Update status**.
- Ensure the current claim status permits the requested next status.
- Check the browser Developer Tools → Network tab for the PATCH response.

## Security notes and known limitations

- Demo users are configured in backend memory.
- The JWT is held in browser `sessionStorage` for this assessment UI.
- The browser-side claimant filter is only a display convenience. The backend must enforce claimant ownership before real claim data is used.
- The backend response has no currency field. The frontend must not assume a currency for a market; add currency to the domain/API before production.
- Do not place production passwords or JWT secrets in frontend source code.

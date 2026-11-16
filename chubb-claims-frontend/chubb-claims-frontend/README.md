# Chubb Claims Frontend

Angular frontend for the Chubb APAC Claims Management Backend. It provides a login page, claimant claim submission and tracking, and a claims-team workspace for reviewing and updating claims.

## Features

- Angular standalone components and route configuration.
- JWT login using the backend `POST /api/v1/auth/login` endpoint.
- HTTP interceptor adds `Authorization: Bearer <token>` to API calls.
- Login session stored in browser `sessionStorage`.
- Claimant dashboard and new-claim form.
- Officer/manager dashboard, claim assignment, status progression and approval/rejection decision UI.
- Status filtering, claim detail and claim lifecycle timeline.
- Development proxy forwards `/api/**` to `http://localhost:8080`, avoiding local browser CORS setup.

## Stack and compatibility

- Angular `22.2.6`
- TypeScript `6.0.x`
- RxJS `7.8.x`
- Node.js supported by Angular 22: `22.22.3+` in the 22.x line or `24.15.0+` in the 24.x line (see the official [Angular version compatibility table](https://angular.dev/reference/versions)).
- Backend: Spring Boot at `http://localhost:8080`

## Run locally on Windows

### 1. Check Node and npm

Open CMD or PowerShell:

```cmd
node -v
npm -v
```

Use a Node version supported by Angular 22. If your Node version is too old, install a compatible Node.js release before continuing.

### 2. Start the backend

Start PostgreSQL and Kafka, then run the Spring Boot backend on port `8080`. Verify that login works at:

```text
POST http://localhost:8080/api/v1/auth/login
```

The frontend expects the backend demo accounts below (defined in the backend `SecurityConfig`):

| Role | Username | Password |
|---|---|---|
| Claimant | `claimant@chubb.test` | `Claimant@123` |
| Claims officer | `officer@chubb.test` | `Officer@123` |
| Manager | `manager@chubb.test` | `Manager@123` |

### 3. Install frontend dependencies

Open CMD in the `chubb-claims-frontend` directory (the directory containing `package.json`):

```cmd
npm install
```

### 4. Start Angular

```cmd
npm start
```

Open:

```text
http://localhost:4200
```

The Angular dev server uses `proxy.conf.json` to forward API requests to Spring Boot at `http://localhost:8080`.

### 5. Build

```cmd
npm run build
```

Build output is generated in `dist/chubb-claims-frontend`.

## Import into STS / Eclipse

Angular is a Node.js project, not a Maven project.

1. Extract this project folder.
2. In STS, use **File → Open Projects from File System** (or **File → Import → General → Projects from Folder or Archive**) to view the source, or simply open the folder in VS Code.
3. Open a terminal in the folder containing `package.json`.
4. Run `npm install`, then `npm start`.
5. Keep Spring Boot running separately in STS.

Recommended workflow: use STS for the Java backend and VS Code (or another editor with Angular/TypeScript support) for the frontend.

## User journeys

### Claimant

1. Sign in using `claimant@chubb.test`.
2. View the claims dashboard.
3. Select **New claim**.
4. Enter claimant name, email, claim type, market, incident description and estimated loss.
5. Submit the claim.
6. View the claim detail and current status.

### Claims officer

1. Sign in using `officer@chubb.test`.
2. View the claims register.
3. Open a claim.
4. Assign an officer email.
5. Move a submitted claim to `UNDER_REVIEW`.
6. Request information, return an awaiting-information claim to review, or record an approval/rejection decision.
7. Move an approved claim to `SETTLED`.

### Manager

The manager demo account has both `ROLE_MANAGER` and `ROLE_OFFICER` authorities and can use the officer workspace functions.

## Backend API contract used by this frontend

The frontend calls these endpoints through the `/api` proxy:

| Method | Endpoint | Usage |
|---|---|---|
| POST | `/api/v1/auth/login` | Get JWT |
| POST | `/api/v1/claims` | Create claim |
| GET | `/api/v1/claims?page=0&size=100&sort=createdAt,desc` | List claims |
| GET | `/api/v1/claims/{id}` | Get claim details |
| PATCH | `/api/v1/claims/{id}/assignment` | Assign officer |
| PATCH | `/api/v1/claims/{id}/status?status=UNDER_REVIEW` | Change status |
| POST | `/api/v1/claims/{id}/decision` | Approve or reject |

### Submit claim example

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

### Assign claim example

```json
{
  "officer": "officer1@chubb.example"
}
```

### Decision example

```json
{
  "outcome": "APPROVED",
  "reason": "Evidence reviewed and claim approved."
}
```

## Claim statuses shown in the UI

- `SUBMITTED`
- `UNDER_REVIEW`
- `AWAITING_INFORMATION`
- `APPROVED`
- `REJECTED`
- `SETTLED`

The UI offers the transitions implemented by the backend domain model.

## Important backend notes

1. The backend sample uses in-memory demo users. The frontend does not register users or manage passwords.
2. The backend currently permits claimant-role users to call the claim list and detail GET endpoints. The dashboard filters a claimant's rows in the browser for display only. This is **not data security**: the backend must enforce claimant ownership server-side before real or confidential use.
3. The dashboard currently loads the first 100 claims from the backend. Pagination controls are not implemented.
4. The backend claim model has no currency field. The UI displays estimated-loss values with a USD marker as a demo convention only. Confirm and model currency by market before production.
5. JWT is held in `sessionStorage` for this assessment UI. Production applications should consider an appropriately secured HttpOnly cookie/BFF pattern, a stronger XSS posture and token lifecycle controls.
6. The API's claim list response is expected to be a Spring Data `Page` object with a `content` array and paging metadata.
7. Kafka activity is performed by the backend; the browser does not connect directly to Kafka.

## Troubleshooting

### Login says it cannot connect or returns 401

- Confirm the backend is running on port `8080`.
- Test the login endpoint directly using Postman.
- Check username/password and the backend in-memory demo users.
- Check that the backend JWT signing secret is configured consistently.

### Angular returns 502 / proxy error

- Confirm Spring Boot is listening on `http://localhost:8080`.
- Stop and restart `npm start` after changing `proxy.conf.json`.
- Verify the proxy target is `http://localhost:8080`.

### Browser shows 403

- Confirm that the JWT is present (sign out and sign in again).
- Check that the requested action is allowed for the current role.
- Claim assignment, status changes and decisions require OFFICER or MANAGER.

### Claim submission returns 400

- Check email format.
- `market` must be exactly two uppercase letters, e.g. `SG`.
- `estimatedLoss` must be at least `0.01`.
- Claim description must not exceed 2,000 characters.

## Folder structure

```text
chubb-claims-frontend/
├── package.json
├── angular.json
├── tsconfig.json
├── proxy.conf.json
├── README.md
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.scss
    └── app/
        ├── app.component.ts
        ├── app.routes.ts
        ├── core/
        │   ├── auth.guards.ts
        │   ├── auth.interceptor.ts
        │   ├── auth.service.ts
        │   ├── claims-api.service.ts
        │   └── models.ts
        └── pages/
            ├── login.component.ts
            ├── dashboard.component.ts
            ├── new-claim.component.ts
            └── claim-detail.component.ts
```

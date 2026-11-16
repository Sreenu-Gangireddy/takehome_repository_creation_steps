# Frontend / backend integration notes

- Angular origin: `http://localhost:4200`
- Spring Boot API origin: `http://localhost:8080`
- Angular calls API paths beginning `/api/`; `proxy.conf.json` forwards them to port 8080.
- Login token is returned by `POST /api/v1/auth/login`.
- `auth.interceptor.ts` attaches the bearer token to API requests.
- `claims-api.service.ts` contains the frontend's endpoint mapping.
- `models.ts` mirrors the backend DTO/response fields and status enum.
- `AuthService` reads the JWT `sub` and `roles` claims for navigation presentation and route behavior. Backend Spring Security remains the actual authorization authority.

## Role behavior expected by backend SecurityConfig

- `ROLE_CLAIMANT`: POST claims and GET claims / claim detail
- `ROLE_OFFICER`: the claimant operations plus assignment, status changes and decisions
- `ROLE_MANAGER`: the officer operations

The current backend security configuration does not restrict claimant GET results by ownership. Do not use this demo setup with real personal or claim data until the backend adds server-side claimant scoping.

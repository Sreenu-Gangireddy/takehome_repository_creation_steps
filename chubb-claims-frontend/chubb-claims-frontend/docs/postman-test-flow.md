# Postman test flow

Set `baseUrl` to `http://localhost:8080`.

1. `POST {{baseUrl}}/api/v1/auth/login`
   ```json
   {"username":"officer@chubb.test","password":"Officer@123"}
   ```
   Copy `accessToken` and use it as a Bearer token for subsequent requests.

2. `POST {{baseUrl}}/api/v1/claims`
   ```json
   {
     "claimantName":"Alex Tan",
     "claimantEmail":"alex.tan@example.com",
     "claimType":"MOTOR",
     "market":"SG",
     "incidentDescription":"Vehicle damage after a road accident.",
     "estimatedLoss":5000.00
   }
   ```
   Save returned `id` as `claimId`.

3. `GET {{baseUrl}}/api/v1/claims?page=0&size=10`
4. `GET {{baseUrl}}/api/v1/claims/{{claimId}}`
5. `PATCH {{baseUrl}}/api/v1/claims/{{claimId}}/assignment`
   ```json
   {"officer":"officer1@chubb.example"}
   ```
6. `PATCH {{baseUrl}}/api/v1/claims/{{claimId}}/status?status=UNDER_REVIEW`
7. `POST {{baseUrl}}/api/v1/claims/{{claimId}}/decision`
   ```json
   {"outcome":"APPROVED","reason":"Evidence reviewed and claim approved."}
   ```
8. `PATCH {{baseUrl}}/api/v1/claims/{{claimId}}/status?status=SETTLED`
9. `GET {{baseUrl}}/api/v1/claims/{{claimId}}`

For the authorization check, log in as `claimant@chubb.test` and try the assignment endpoint: the current backend policy should return `403 Forbidden`.

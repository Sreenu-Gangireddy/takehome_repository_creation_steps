# Chubb APAC Claims Backend (Java 21)

Backend take-home implementation using Spring Boot, PostgreSQL, Kafka and JWT.

## Prerequisites
- JDK 21
- Maven 3.9+
- Docker Desktop / Docker Engine

## Start infrastructure
```bash
docker compose up -d
```
PostgreSQL is available on `localhost:5432`; Kafka on `localhost:9092`.

## Configure JWT secret
The checked-in default is for local demonstration only. Set a strong secret before running:
```bash
# Git Bash (current shell)
export JWT_SECRET="$(openssl rand -base64 48)"
```
Windows PowerShell:
```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret-of-at-least-32-bytes"
```

## Run
```bash
mvn clean test
mvn spring-boot:run
```
Swagger UI: http://localhost:8080/swagger-ui/index.html

## Demo login accounts
These are in-memory demo users only; replace with persisted users/enterprise identity provider before production:
| Role | Username | Password |
|---|---|---|
| Claimant | claimant@chubb.test | Claimant@123 |
| Officer | officer@chubb.test | Officer@123 |
| Manager | manager@chubb.test | Manager@123 |

Get a JWT:
```http
POST /api/v1/auth/login
Content-Type: application/json

{"username":"officer@chubb.test","password":"Officer@123"}
```
Use the returned token:
```http
Authorization: Bearer <accessToken>
```

## Kafka
- Topic: `claims.lifecycle` (3 partitions, one local replica)
- Producer sends JSON lifecycle events for submitted, assigned, status-changed and decided claims.
- Producer config uses `acks=all`, retries and idempotence.
- Consumer group `claims-audit-consumer` logs received events. Replace the demo logger with durable audit/notification persistence.
- For production, add retry topics / dead-letter topic, schema compatibility (Avro/Protobuf or governed JSON), monitoring, ACL/TLS, and an outbox pattern. Current publish-after-save flow is a take-home demonstration and is not atomic with the database transaction.

## Tests
Includes domain lifecycle tests, service tests with Mockito, JWT tests, and Kafka publisher tests. Run `mvn test`.

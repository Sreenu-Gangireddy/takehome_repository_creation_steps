
Chubb APAC Claims Management Backend
A backend application for the Chubb APAC claims-management take-home assessment. It is built with Java 21 and Spring Boot and exposes REST APIs for claim submission, claim lookup, assignment, status progression, and claim decisions. It also demonstrates JWT authentication, role-based endpoint access, PostgreSQL persistence with Flyway migrations, and Kafka claim-lifecycle events.

Assessment scope: The supplied assessment brief states that the frontend is out of scope. This repository focuses on the backend and its API contract.

Contents
1. Features
2. Technology stack
3. Prerequisites
4. Project structure
5. Configure PostgreSQL
6. Configure the application
7. Start Kafka
8. Run the application
9. Authentication and demo accounts
10. REST API reference
11. End-to-end Postman test sequence
12. Claim lifecycle and valid transitions
13. Kafka event flow
14. Database schema
15. Run automated tests
16. Common troubleshooting
17. Git commands
18. Current limitations and production hardening
1. Features
Submit a motor or property claim through a REST API.
Retrieve claims by ID.
Retrieve a paginated list of claims, optionally filtered by status.
Assign a claim to an officer.
Progress a claim through supported lifecycle states.
Record an approval or rejection decision with a reason.
Authenticate users with JWT bearer tokens.
Apply role-based authorization to claim endpoints.
Persist claim records in PostgreSQL.
Create/update the database schema using Flyway migrations.
Publish claim-lifecycle events to Kafka and consume them in an audit-log demonstration consumer.
Unit tests for core claim-status rules, service behavior, JWT service behavior, and Kafka event publishing.
2. Technology stack
Concern	Technology
Language	Java 21
Framework	Spring Boot 3.5.x
Build	Maven
REST APIs	Spring Web
Request validation	Jakarta Bean Validation
Persistence	Spring Data JPA / Hibernate
Database	PostgreSQL
Database migrations	Flyway
Authentication and authorization	Spring Security, JWT, BCrypt
Messaging	Spring for Apache Kafka
API documentation UI	Springdoc OpenAPI / Swagger UI
Tests	JUnit 5, Mockito, Spring Boot Test
3. Prerequisites
Install or configure:

JDK 21. Check with java -version.
Maven 3.9+. Check with mvn -version. If the repository contains Maven Wrapper files, mvnw.cmd can be used instead.
PostgreSQL. The application configuration below expects a database named claims.
Kafka. You can use the included Docker Compose Kafka service or an existing local Kafka broker.
Postman (recommended) to exercise the endpoints.
In Spring Tool Suite (STS), verify JDK 21 under Window → Preferences → Java → Installed JREs. Also check Project → Properties → Java Build Path and Java Compiler.

4. Project structure
chubb-claims-backend/
├── pom.xml
├── README.md
├── docker-compose.yml
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   └── api-examples.md
├── prompts/
│   └── AI_WORKING_JOURNAL.md
└── src/
    ├── main/
    │   ├── java/com/chubb/claims/
    │   │   ├── api/              # REST controllers and request/response DTOs
    │   │   ├── domain/           # Claim entity, statuses and domain rules
    │   │   ├── infrastructure/   # Spring Data repository
    │   │   ├── messaging/        # Kafka event, publisher, consumer and topic config
    │   │   ├── security/         # JWT service, filter and Spring Security config
    │   │   └── service/          # Claim use cases and business orchestration
    │   └── resources/
    │       ├── application.properties
    │       └── db/migration/
    │           └── V1__create_claims.sql
    └── test/java/com/chubb/claims/
        ├── messaging/
        ├── security/
        └── service/
Architecture diagrams
The backend is implemented as a modular monolith: one Spring Boot application with clear API, security, service, domain, persistence, and messaging boundaries. Kafka is used for claim-lifecycle events; it does not turn the application into a set of microservices.

1. Overall system architecture
Spring Boot backend - one deployable application
Angular frontend - browser application
Spring Security + JWT filter +role checks
REST Controllers
ClaimService / business rules
Spring Data JPA repository
ClaimEventPublisher
ClaimEventConsumer
Login, Dashboard, New Claim,Claim Detail
Angular services + HTTPinterceptor
JWT in sessionStorage
Claimant / Claims Officer /Manager
PostgreSQL
Kafka topic: claims.lifecycle
HTTP / JSON + Bearer JWT
Claim lifecycle event
2. Frontend-to-backend request flow
PostgreSQL
ClaimService
ClaimController
Spring Security / JWT filter
HTTP interceptor
ClaimsApiService
Angular component
PostgreSQL
ClaimService
ClaimController
Spring Security / JWT filter
HTTP interceptor
ClaimsApiService
Angular component
User
Submit claim / request claims
Invoke API method
HTTP request
Attach Authorization: Bearer token
Forward request through dev proxy
Authenticate JWT and check role
Allow authorized request
Execute use case
Read or write claim through repository
Persisted entity / query result
Result
HTTP response
Response
Data / error
Update page
User
3. Backend internal layers
HTTP request
Spring Security filter chain
JWT authentication filter
Role-based authorization
API layer: AuthController /ClaimController
Service layer: ClaimService
Domain: Claim entity andlifecycle rules
Infrastructure: ClaimRepository
PostgreSQL
Messaging:ClaimEventPublisher
Kafka: claims.lifecycle
ClaimEventConsumer
Demo audit processing / eventlogging
4. Kafka event flow
ClaimEventConsumer
Kafka claims.lifecycle
ClaimEventPublisher
PostgreSQL
ClaimService
REST API
ClaimEventConsumer
Kafka claims.lifecycle
ClaimEventPublisher
PostgreSQL
ClaimService
REST API
Submit or change claim
Save claim state
Saved claim
Publish claim event
Send event keyed by claim ID
Deliver event to claims-audit-consumer
Log/process event for demo audit flow
Return REST result
The current consumer demonstrates event receipt and logging. It does not currently persist a separate audit record or send notifications. The current implementation also does not show a transactional outbox; treat reliable outbox publishing as a production-hardening item.

5. Claim data flow - submit and review
Synchronous vs asynchronous paths

Synchronous: Angular → REST API → security/validation → service → PostgreSQL → HTTP response. The caller receives the claim operation result through the API.
Asynchronous: Claim service → Kafka producer → claims.lifecycle → audit consumer. The consumer processes the event independently of the browser request.
Source of truth: PostgreSQL stores the claim's current state. Kafka carries lifecycle events to consumers.
5. Configure PostgreSQL
Create a PostgreSQL role and database. Run these statements while connected as the PostgreSQL administrator (postgres) in psql or pgAdmin Query Tool:

CREATE ROLE claims WITH LOGIN PASSWORD 'change-this-local-password';
CREATE DATABASE claims OWNER claims;
If the role or database already exists, use the appropriate statements instead:

ALTER ROLE claims WITH LOGIN PASSWORD 'change-this-local-password';
ALTER DATABASE claims OWNER TO claims;
Connect to the claims database and grant schema permissions:

\c claims
GRANT USAGE, CREATE ON SCHEMA public TO claims;
ALTER SCHEMA public OWNER TO claims;
Verify the application user can connect:

psql -h localhost -p 5432 -U claims -d claims -W
Then run:

SELECT current_user, current_database(),
       has_schema_privilege(current_user, 'public', 'CREATE');
Expected values: current_user = claims, current_database = claims, and the schema CREATE privilege is true.

PostgreSQL with Docker (optional)
The included docker-compose.yml defines a PostgreSQL container with local demo credentials:

Database: claims
Username: claims
Password: claims
Port: 5432
Start only the PostgreSQL container with:

docker compose up -d postgres
Important: The Docker Compose PostgreSQL defaults are username claims and password claims. For a native PostgreSQL installation, use the password you assigned to the claims role (for example, tiger) by setting DB_PASSWORD or editing spring.datasource.password. Do not start the Docker PostgreSQL container if your native PostgreSQL is already using port 5432; choose one database server.

6. Configure the application
Create or update src/main/resources/application.properties:

# Application
spring.application.name=chubb-claims-backend
server.port=${SERVER_PORT:8080}

# PostgreSQL
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/claims}
spring.datasource.username=${DB_USERNAME:claims}
spring.datasource.password=${DB_PASSWORD:change-this-local-password}

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true

# Kafka broker
spring.kafka.bootstrap-servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}

# Kafka producer
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.acks=all
spring.kafka.producer.retries=10
spring.kafka.producer.properties.enable.idempotence=true
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5

# Kafka consumer
spring.kafka.consumer.group-id=claims-audit-consumer
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=com.chubb.claims.messaging
spring.kafka.consumer.properties.spring.json.value.default.type=com.chubb.claims.messaging.ClaimEvent
spring.kafka.listener.ack-mode=record

# JWT
# Use a long random secret (at least 32 bytes for the configured HMAC key).
app.jwt.secret=${JWT_SECRET:change-this-demo-secret-key-to-a-long-random-32-byte-value}
app.jwt.expiration-seconds=${JWT_EXPIRATION_SECONDS:3600}
Set a strong JWT secret outside source control. Do not commit real database passwords, JWT secrets, or production credentials.

If your project still has application.yml, either keep using that YAML configuration or migrate it to application.properties; avoid maintaining conflicting values in both files.

7. Start Kafka
Option A: Use the included Docker Compose Kafka service
If Docker Desktop is running and port 9092 is available:

docker compose up -d kafka
Check the containers:

docker compose ps
The application is configured to connect to localhost:9092.

Option B: Use an existing Kafka installation
Start your Kafka broker and set:

spring.kafka.bootstrap-servers=localhost:9092
Kafka must be running before you test claim operations that publish events. The configured topic is claims.lifecycle; the application declares it with three partitions and one replica for local development.

8. Run the application
From the directory containing pom.xml:

mvn clean test
mvn spring-boot:run
Or in STS:

Import the folder as Existing Maven Projects.
Right-click the project.
Select Maven → Update Project.
Confirm the project uses JDK 21.
Select Run As → Spring Boot App.
When startup succeeds, the API base URL is:

http://localhost:8080
Swagger UI (if Springdoc is on the classpath):

http://localhost:8080/swagger-ui/index.html
OpenAPI JSON:

http://localhost:8080/v3/api-docs
9. Authentication and demo accounts
The current sample SecurityConfig uses in-memory demonstration users. There is no user-registration endpoint and these users are not stored in PostgreSQL.

Role	Username	Password
Claimant	claimant@chubb.test	Claimant@123
Officer	officer@chubb.test	Officer@123
Manager	manager@chubb.test	Manager@123
Obtain a JWT
Request

POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json
Body

{
  "username": "officer@chubb.test",
  "password": "Officer@123"
}
Successful response (example)

{
  "accessToken": "<signed-jwt-token>",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600
}
Copy accessToken. For protected requests, send this header:

Authorization: Bearer <accessToken>
In Postman, select Authorization → Bearer Token and paste the token without typing Bearer into the token field; Postman adds the prefix.

10. REST API reference
Base URL:

http://localhost:8080
All claim endpoints require a valid JWT bearer token. The login endpoint is public.

Endpoint summary
Method	Endpoint	Purpose	Access under current security rules
POST	/api/v1/auth/login	Authenticate and return a JWT	Public
POST	/api/v1/claims	Submit a claim	CLAIMANT, OFFICER, MANAGER
GET	/api/v1/claims	List claims with pagination / optional status filter	CLAIMANT, OFFICER, MANAGER
GET	/api/v1/claims/{id}	Retrieve one claim	CLAIMANT, OFFICER, MANAGER
PATCH	/api/v1/claims/{id}/assignment	Assign a claim to an officer	OFFICER, MANAGER
PATCH	/api/v1/claims/{id}/status	Progress the claim status	OFFICER, MANAGER
POST	/api/v1/claims/{id}/decision	Approve or reject a claim	OFFICER, MANAGER
10.1 Login
POST /api/v1/auth/login
Content-Type: application/json
Request:

{
  "username": "officer@chubb.test",
  "password": "Officer@123"
}
Response:

{
  "accessToken": "<signed-jwt-token>",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600
}
Invalid credentials return HTTP 401 Unauthorized.

10.2 Submit a claim
POST /api/v1/claims
Authorization: Bearer <token>
Content-Type: application/json
Request:

{
  "claimantName": "Alex Tan",
  "claimantEmail": "alex.tan@example.com",
  "claimType": "MOTOR",
  "market": "SG",
  "incidentDescription": "Vehicle was damaged in a road accident.",
  "estimatedLoss": 5000.00
}
Field guidance:

Field	Required	Validation / meaning
claimantName	Yes	Must not be blank
claimantEmail	Yes	Must not be blank and must be a valid email
claimType	Yes	Must not be blank; examples include MOTOR or PROPERTY
market	Yes	Two uppercase letters, e.g. SG, AU, IN
incidentDescription	Yes	Must not be blank; maximum 2,000 characters
estimatedLoss	Yes	Numeric amount greater than 0.01 or equal to 0.01
Success: HTTP 201 Created. Save the returned id for the remaining requests.

Response example:

{
  "id": "8e5a7e25-61c0-4d18-8e17-83dd44c026b3",
  "claimantName": "Alex Tan",
  "claimantEmail": "alex.tan@example.com",
  "claimType": "MOTOR",
  "market": "SG",
  "incidentDescription": "Vehicle was damaged in a road accident.",
  "estimatedLoss": 5000.00,
  "status": "SUBMITTED",
  "assignedOfficer": null,
  "decisionReason": null,
  "createdAt": "2026-11-16T10:00:00Z",
  "updatedAt": "2026-11-16T10:00:00Z"
}
The ID and timestamps above are illustrative; use the values returned by your running application.

10.3 List claims
GET /api/v1/claims
Authorization: Bearer <token>
Optional query parameters:

Parameter	Example	Meaning
page	0	Zero-based page number
size	10	Page size
sort	createdAt,desc	Sort field and direction
status	SUBMITTED	Filter by a ClaimStatus value
Examples:

GET /api/v1/claims?page=0&size=10
GET /api/v1/claims?page=0&size=10&sort=createdAt,desc
GET /api/v1/claims?status=SUBMITTED
GET /api/v1/claims?status=UNDER_REVIEW&page=0&size=20
The default page size is 20, sorted by createdAt descending. The response is a Spring Data Page containing content, page information, and total counts.

10.4 Get one claim
GET /api/v1/claims/{id}
Authorization: Bearer <token>
Example:

GET /api/v1/claims/8e5a7e25-61c0-4d18-8e17-83dd44c026b3
Replace the UUID with the id returned by the submit-claim endpoint. A missing ID is handled as a claim-not-found error.

10.5 Assign a claim to an officer
PATCH /api/v1/claims/{id}/assignment
Authorization: Bearer <officer-or-manager-token>
Content-Type: application/json
Request:

{
  "officer": "officer1@chubb.example"
}
The officer value must not be blank. Success returns the updated claim. Under the current security rules, only OFFICER and MANAGER roles can call this endpoint.

10.6 Progress a claim status
PATCH /api/v1/claims/{id}/status?status=UNDER_REVIEW
Authorization: Bearer <officer-or-manager-token>
The status query parameter must be a valid enum value. See Claim lifecycle and valid transitions before choosing the next status.

Examples:

PATCH /api/v1/claims/{id}/status?status=UNDER_REVIEW
PATCH /api/v1/claims/{id}/status?status=AWAITING_INFORMATION
PATCH /api/v1/claims/{id}/status?status=SETTLED
The example requests are only valid when the claim's current status permits that transition.

10.7 Record an approval or rejection decision
POST /api/v1/claims/{id}/decision
Authorization: Bearer <officer-or-manager-token>
Content-Type: application/json
Approval request:

{
  "outcome": "APPROVED",
  "reason": "The submitted evidence was reviewed and the claim is approved."
}
Rejection request:

{
  "outcome": "REJECTED",
  "reason": "The submitted evidence does not satisfy the policy requirements."
}
Both fields are required. reason has a maximum length of 2,000 characters. The outcome must be APPROVED or REJECTED, and the claim must be in a state from which that decision is allowed (normally UNDER_REVIEW).

Common HTTP responses
HTTP status	Meaning
200 OK	Request succeeded
201 Created	Claim created
400 Bad Request	Invalid JSON, validation failure, invalid enum, or invalid lifecycle transition
401 Unauthorized	Authentication is missing or invalid, depending on the configured security entry point
403 Forbidden	Authenticated user does not have the required role
404 Not Found	Claim ID does not exist
500 Internal Server Error	Unexpected application or infrastructure error
11. End-to-end Postman test sequence
Use this sequence to test a complete claim journey.

Start PostgreSQL and Kafka, then start the Spring Boot application.
Login as claimant using POST /api/v1/auth/login and the claimant demo credentials. Copy the accessToken.
Submit a claim using POST /api/v1/claims with the JSON in section 10.2. Save the returned claim id.
List claims using GET /api/v1/claims?page=0&size=10. Send the claimant token.
Get the claim by ID using GET /api/v1/claims/{id}.
Login as officer and copy the officer token.
Assign the claim using PATCH /api/v1/claims/{id}/assignment.
Move the claim to review using PATCH /api/v1/claims/{id}/status?status=UNDER_REVIEW.
Approve or reject using POST /api/v1/claims/{id}/decision.
Verify the final claim using GET /api/v1/claims/{id} and check its status and decision reason.
Check the application console for the corresponding Kafka event consumer log.
For Postman, create an environment variable named baseUrl with value http://localhost:8080. Store each login token in a variable such as claimantToken or officerToken. Set the request's Authorization type to Bearer Token.

Authorization checks to try
Call GET /api/v1/claims without a token: access should be denied.
Call the assignment endpoint using the claimant token: expect HTTP 403 Forbidden.
Call the assignment endpoint using the officer or manager token: authorization should pass, provided the request is valid and the claim exists.
Call login with an incorrect password: expect HTTP 401 Unauthorized.
12. Claim lifecycle and valid transitions
The ClaimStatus enum currently defines:

SUBMITTED
UNDER_REVIEW
AWAITING_INFORMATION
APPROVED
REJECTED
SETTLED
Allowed transitions in the current domain implementation:

Current status	Allowed next status
SUBMITTED	UNDER_REVIEW
UNDER_REVIEW	AWAITING_INFORMATION, APPROVED, REJECTED
AWAITING_INFORMATION	UNDER_REVIEW
APPROVED	SETTLED
REJECTED	None (terminal)
SETTLED	None (terminal)
Example happy path:

SUBMITTED
   |
   v
UNDER_REVIEW
   |--------------------|
   v                    v
AWAITING_INFORMATION   APPROVED -----> SETTLED
   |
   v
UNDER_REVIEW
   |
   v
REJECTED (alternative decision)
An invalid transition raises a domain exception and is mapped by the API exception handler.

13. Kafka event flow
The application publishes events to the Kafka topic:

claims.lifecycle
The topic configuration requests three partitions and one replica for local development. The producer uses the claim ID as the message key and publishes a JSON event.

Current event types:

Event type	Trigger
CLAIM_SUBMITTED	A claim is submitted
CLAIM_ASSIGNED	An officer is assigned
CLAIM_STATUS_CHANGED	A claim status is progressed
CLAIM_DECIDED	An approval or rejection decision is recorded
Event payload shape:

{
  "eventId": "generated-event-uuid",
  "eventType": "CLAIM_SUBMITTED",
  "claimId": "claim-uuid",
  "status": "SUBMITTED",
  "market": "SG",
  "estimatedLoss": 5000.00,
  "occurredAt": "2026-11-16T10:00:00Z"
}
The ClaimEventConsumer listens with consumer group claims-audit-consumer and currently logs the received event. Check the Spring Boot console after submitting or updating a claim.

Important: The current implementation is a take-home demonstration. It publishes after saving the claim but does not yet implement a transactional outbox, durable audit storage, retry topics, or a dead-letter topic. See Current limitations and production hardening.

14. Database schema
Flyway migration:

src/main/resources/db/migration/V1__create_claims.sql
The claims table stores:

Column	Purpose
id	Claim UUID primary key
claimant_name	Claimant's name
claimant_email	Claimant's email
claim_type	Claim category, e.g. MOTOR or PROPERTY
market	Two-character market code
incident_description	Incident details
estimated_loss	Estimated loss amount
status	Current claim lifecycle status
assigned_officer	Assigned officer identifier
decision_reason	Reason for approval or rejection
created_at	Creation timestamp
updated_at	Last update timestamp
version	JPA optimistic-lock version
Useful verification queries in pgAdmin or psql:

-- Confirm the current connection
SELECT current_user, current_database();

-- List claims
SELECT id, claimant_name, claim_type, market, status, estimated_loss
FROM claims
ORDER BY created_at DESC;

-- Count claims by status
SELECT status, COUNT(*)
FROM claims
GROUP BY status
ORDER BY status;

-- Review Flyway migration history
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
15. Run automated tests
Run all tests:

mvn clean test
In STS, right-click src/test/java or an individual test class and choose Run As → JUnit Test.

Current test coverage includes:

Test class	Focus
ClaimStatusTest	Valid and invalid lifecycle transitions
ClaimServiceTest	Claim submission, event invocation, and missing-claim handling
JwtServiceTest	JWT creation, subject extraction, tamper rejection, and user validation
ClaimEventPublisherTest	Publishing a lifecycle event to the Kafka template
These are unit-level tests. Full end-to-end testing with a real PostgreSQL and Kafka instance can be added using Testcontainers or an equivalent integration-test setup.

16. Common troubleshooting
403 Forbidden on a claim endpoint
Login at POST /api/v1/auth/login.
Copy the accessToken.
In Postman, choose Authorization → Bearer Token.
Paste the token and retry.
Confirm the account role is allowed by the security configuration. For example, claimant users cannot call assignment, status, or decision endpoints.
401 Unauthorized on login
Check the username and password exactly. The demo accounts are configured in memory by SecurityConfig; they are not PostgreSQL users.

PostgreSQL password authentication failed
Confirm the username and password in application.properties or the DB_USERNAME / DB_PASSWORD environment variables. Test the same credentials directly with:

psql -h localhost -p 5432 -U claims -d claims -W
Permission denied for schema public
Connect as the PostgreSQL administrator, switch to the claims database, and grant the application role schema permissions:

\c claims
GRANT USAGE, CREATE ON SCHEMA public TO claims;
ALTER SCHEMA public OWNER TO claims;
Flyway connects to the wrong database
Read the JDBC URL in the startup log. It should be:

jdbc:postgresql://localhost:5432/claims
Check spring.datasource.url and whether the DB_URL environment variable overrides it.

Kafka connection or publish errors
Confirm Kafka is running and listening on localhost:9092.
Check spring.kafka.bootstrap-servers.
If using Docker, run docker compose ps and inspect the Kafka container logs.
Claim submission and lifecycle changes publish events, so Kafka should be available while exercising those flows.
Flyway says PostgreSQL version is newer than supported
This warning is about the version tested by the Flyway release, not necessarily the cause of a migration failure. Use a Flyway release that supports your PostgreSQL version and verify the migration on your local database.

17. Git workflow
Check the working tree:

git status
Add the README and source changes:

git add README.md src pom.xml
Create a meaningful commit:

git commit -m "docs(claims): add setup and REST API guide"
Push your assessment branch:

git push -u origin feature/chubb-claims
If the assessment repository does not grant your GitHub account write access, ask the assessment team for repository access or the required submission workflow before attempting to push directly.

18. Current limitations and production hardening
This is an assessment implementation, not a production-ready insurance claims platform. Important next steps include:

Replace in-memory demo users with persisted users or an enterprise identity provider.
Enforce claimant ownership so a claimant can only retrieve their own claims. The current role rules permit any authenticated CLAIMANT to call the claim GET routes.
Add a transactional outbox so a committed database change cannot be lost if Kafka publishing fails.
Add Kafka retry handling, dead-letter topics, consumer idempotency, and durable audit-event persistence.
Add integration tests covering REST + PostgreSQL + Kafka, authorization rules, and error responses.
Add stronger audit history, structured logging, metrics, and health checks.
Externalize all secrets and use TLS/ACLs for database and Kafka connections in deployed environments.
Confirm market-specific validation, claim policy rules, settlement rules, and liability exposure requirements with the business domain.
Assessment walkthrough suggestion
A concise demo flow for the technical panel:

Explain the domain and claim lifecycle.
Show the package boundaries and PostgreSQL schema.
Login and obtain a JWT.
Submit a claim and retrieve it.
Assign it to an officer, move it to review, and record a decision.
Show the Kafka event in the consumer log.
Run the automated tests.
Explain the design trade-offs and production improvements listed above.





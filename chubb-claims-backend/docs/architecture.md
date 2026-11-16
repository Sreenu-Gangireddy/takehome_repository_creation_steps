# Architecture

## Initial service boundary
A modular monolith is chosen for the time-boxed assessment: one deployable claims service with clear API, domain, service, and infrastructure packages. This avoids premature distributed-system complexity while preserving boundaries that can later be extracted.

## Synchronous vs asynchronous
REST is used for claimant submission, status tracking, officer assignment, review progression, and decisions because callers need immediate validation and a result. Kafka is a suitable future integration channel for notifications, analytics, and downstream policy/payment workflows. Publish domain events through a transactional outbox rather than publishing directly inside a database transaction.

## Core model
`Claim` stores claimant contact, claim type, market, incident description, estimated loss, lifecycle status, assigned officer, decision reason, and timestamps. `ClaimStatus` centralizes allowed transitions. `@Version` provides optimistic concurrency protection.

## Read paths
The initial API supports pagination and status filtering, with indexes on status/created time and assigned officer. A manager dashboard and liability exposure read model are future work.

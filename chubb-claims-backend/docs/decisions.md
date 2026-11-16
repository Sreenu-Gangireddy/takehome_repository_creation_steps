# Architecture decisions

1. **Java 21 + Spring Boot:** explicitly permitted by the assessment; familiar, productive stack.
2. **Modular monolith first:** assessment time guidance is 2–3 hours with a 5-hour hard cap; avoid distributed deployment overhead.
3. **REST for command/query APIs:** immediate feedback is required for claim submission and staff actions.
4. **Kafka for integration events later:** useful for notifications and downstream consumers; use an outbox for reliable publication.
5. **PostgreSQL:** relational integrity fits claim, claimant, assignment, decision, and exposure data.
6. **Explicit lifecycle transitions:** reject invalid status changes in the domain model, not only in controllers.
7. **Optimistic locking:** prevent silent overwrites when multiple staff members update the same claim.

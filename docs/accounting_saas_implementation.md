# Enterprise Accounting & Administration SaaS Implementation Blueprint

**Status:** Target-state architecture and migration specification  
**Repository baseline:** OVDS monorepo, NestJS 11, Prisma 7, MariaDB  
**Target-state components:** PostgreSQL, optional Citus, Kafka, CQRS/read models  
**Primary accounting scope:** General ledger, multi-tenant isolation, period close, intercompany consolidation, auditability, and jurisdiction-specific tax integration

This document replaces the earlier draft with an implementation-oriented design. It distinguishes the current repository from the target architecture, makes durability and consistency claims testable, and defines the database, API, event, consolidation, and migration contracts that engineering should implement.

## 0. Decisions and corrections

| Earlier claim or design | Correct target-state decision |
|---|---|
| Microsecond global transactional consistency | Use ACID transactions inside one PostgreSQL durability domain. Cross-service and cross-region state is eventually consistent. Publish explicit latency and projection-lag SLOs instead of claiming microsecond global consistency. |
| Zero data loss | Define the boundary: a client receives success only after the ledger commit and durable outbox record are committed. PostgreSQL WAL, synchronous replication, backups, and disaster recovery determine the actual RPO/RTO. Kafka is not the accounting source of truth. |
| Kafka or an event store is the ledger | PostgreSQL is authoritative for posted accounting facts. Kafka transports events and powers projections; consumers must be idempotent. |
| Floating-point or Prisma `Decimal` amounts are sufficient | Store monetary values as integer minor units (`BIGINT`) with an explicit ISO 4217 currency code and scale. Accept decimal strings at the API boundary and convert once. |
| Application-level balance checking is sufficient | Enforce tenant, account, period, balance, immutability, and idempotency, and outbox invariants in the database. A transaction invariants in PostgreSQL.
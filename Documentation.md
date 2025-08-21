# Luxury Real Estate Marketplace (Nepal)  
## MASTER ARCHITECTURE • DR • COST • AWS RATIONALE • FULL Q&A DOSSIER

Version: 1.4 (Final – Full Q&A Expanded)  
Authoring Context: Consolidation of all prior responses (architecture blueprint, DR, cost model, AWS vs other clouds, diagram appraisal, COMPLETE detailed Q&A).  
Audience: Founders, Investors, Product Leadership, Engineering (light), Security & Compliance Reviewers.

---

## 0. Executive Summary (One-Line)
A secure, event-driven, fully serverless, DR‑ready architecture on AWS enabling a premium luxury real estate marketplace with elastic cost, minimal operational overhead, and a phased path toward advanced search, analytics, and AI valuation—while preserving flexibility via open data formats and decoupled events.

---

## 1. Table of Contents
1. Company & Product Overview  
2. Business Objectives & Non-Functional Priorities  
3. High-Level Serverless Architecture  
4. Data Model (Illustrative DynamoDB Single-Table)  
5. Authentication & Authorization Flow  
6. Security (Defense-in-Depth)  
7. Observability & Operations  
8. Disaster Recovery & Resilience (Strategy & Runbooks)  
9. S3 Versioning, Replication & Lifecycle Strategy  
10. Cost Model (Dev / Launch / Growth)  
11. On-Prem / Traditional vs Serverless Comparison  
12. Recommendations & Best Practices (Prioritized)  
13. Implementation Milestones (16-Week Plan)  
14. Extended Comprehensive Technical Q&A Catalogue (Full)  
15. DR Runbook Summary (Condensed Table)  
16. Immediate Action Items  
17. Optional Future Enhancements  
18. Why AWS vs Other Clouds (Comparative Rationale)  
19. Architecture Diagram (image.png) Appraisal & Evolution Plan  
20. AWS Adoption Summary  
21. Concluding Statement  
22. Change Log  

---

## 2. Company & Product Overview (Corrected)
A luxury real estate development & brokerage entity operating in Kathmandu’s premium neighborhoods (Budhanilkantha, Bhaisepati, Sanepa, Dhumbarahi, Bansbari, Maharajgunj). Historically reliant on private investments, off‑market relationships, brokers—multi‑billion NPR turnover. Strategic transition: institutionalize as a “Luxury Realtor Services” digital marketplace showcasing exclusive listings, immersive media (drone, 360° tours), and premium brand positioning—moving from manual brokerage to data-driven platform.

---

## 3. Business Objectives & Non-Functional Priorities
### Business Objectives
- Own platform for premium property listing & marketing.
- Deliver exclusive/premium content and early access tiers.
- Support multi-role ecosystem (buyers, sellers/developers, brokers, admins, investors).
- Enable data-driven insights (engagement, pricing, conversion).
- Introduce monetization via subscriptions & premium visibility.
- Launch rapidly with minimal infrastructure staffing obligations.

### Ranked Non-Functional Priorities
1. Security & Data Integrity  
2. Availability & Performance (low latency in Nepal; region: ap-south-1)  
3. Elastic Cost (usage-based)  
4. Observability & Cost Transparency  
5. Extensibility (event-driven modular design)  
6. Maintainability (small ops overhead)  

---

## 4. High-Level Serverless Architecture

### Edge / Presentation
Component | Detail
----------|-------
S3 (Static & Media) | Versioning, SSE (SSE-S3 or SSE-KMS), Object Ownership enforced, Block Public Access.
CloudFront | Origin Access Control (OAC), behaviors for /static, /media, /api, Signed URLs/Cookies for premium media, HTTP/3 & Brotli, strict security headers (CSP, HSTS, X-Content-Type-Options).
CloudFront Functions | Lightweight personalization/header rewrites.
Lambda@Edge (optional) | Only if heavier edge logic (e.g., advanced auth transforms) is necessary.

### Application / API Layer
- API Gateway (HTTP API) for low-cost routing & JWT validation.
- AWS Lambda (Node.js + Python) with Powertools for logging, tracing, metrics.
- Step Functions for orchestrated multi-step workflows (media ingestion, moderation, geospatial enrichment).
- EventBridge for domain events & decoupling (future microservices).
- SQS for buffering/retries; SNS for notifications.
- AppConfig / Parameter Store for feature flags & environment configuration.
- Secrets Manager for credential rotation and sensitive values.

### Identity & Access
- Cognito User Pools: Roles (buyer, broker, seller, admin) + conditional MFA (brokers/admin).
- Cognito Identity Pool: Guest browsing with scoped IAM read privileges.
- API Gateway JWT Authorizer; fine-grained domain authorization in Lambda (claims: role, subscriptionLevel, brokerId).

### Data & Storage
- DynamoDB single-table (On-Demand, PITR).
- (Optional later) Aurora Serverless v2 for relational financial/reporting.
- S3 buckets: raw-uploads, public-media, premium-media (Versioning + SRR; optional CRR).
- (Phase 2) OpenSearch for complex full-text & geo querying.
- Location Service for geocoding & mapping.
- S3 Data Lake zone (DynamoDB export → Parquet) for Athena/Glue analytics.

### Media Processing
1. Pre-signed upload → raw-uploads bucket.  
2. S3 event → EventBridge → Step Functions pipeline.  
3. Steps: Validate → Virus Scan (optional) → Resize (Lambda Sharp) → Encode (MediaConvert) → Metadata update (DynamoDB).  
4. Output stored (public/premium); MediaProcessed event broadcast.

### Security & Governance
- WAF (managed rule sets: Common, SQLi/XSS, IP reputation, optional Bot Control).
- Shield Standard (Advanced if high DDoS risk emerges).
- IAM: least privilege per function; automated policy linting.
- KMS CMKs segmented (data, media, logs).
- GuardDuty, Security Hub (CIS), AWS Config (drift & compliance), CloudTrail (select Data Events).
- Secrets Manager & Parameter Store separation.

### Observability
- CloudWatch Logs (JSON), Metrics, Alarms (SLO thresholds).
- X-Ray for end-to-end tracing.
- CloudWatch Synthetics (login, search, premium media paths).
- RUM (optional) – Core Web Vitals.
- Budgets + Cost Anomaly Detection; Tag taxonomy (Environment, Owner, CostCenter, DataSensitivity).

### CI/CD & IaC
- CDK or Terraform (final decision early).
- Pipeline (CodePipeline / GitHub Actions) → Build → Test (unit + integration) → Deploy.
- Multi-account org: Sandbox/Dev/Staging/Prod.
- Ephemeral PR stacks for integration tests (auto-destroy).

### Extensibility
- Event-driven enabling future microservices (billing, analytics, ML).
- AI/ML inference endpoints (valuation, recommendations).
- GraphQL/AppSync overlay if client query complexity increases.

---

## 5. Data Model (Illustrative DynamoDB Single-Table)

PK | SK | EntityType | Attributes (Sample)
---|----|------------|--------------------
USER#<UserId> | PROFILE | User | name, email, role, subscriptionLevel, createdAt
USER#<UserId> | FAVORITE#<PropertyId> | Favorite | createdAt
PROPERTY#<PropertyId> | METADATA | Property | price, status, brokerId, locationHash, premiumFlag, createdAt
PROPERTY#<PropertyId> | MEDIA#<MediaId> | Media | mediaType, s3Key, processingState
BROKER#<BrokerId> | PROFILE | Broker | licenseNo, rating, region
PROPERTY#<PropertyId> | VIEWSTAT#<Date> | DailyViewStat | viewCount
SUBSCRIPTION#<UserId> | ACTIVE | Subscription | tier, expiresAt

GSIs:
- GSI1: premiumFlag + createdAt (latest premium listings)  
- GSI2: locationHash + priceBand (geo + price filtering)  
- GSI3: brokerId + status (broker dashboard)  
- GSI4: createdAt (recent listing feed)

---

## 6. Authentication & Authorization Flow
1. Guest loads site via CloudFront.  
2. Guest queries public listing endpoints (guest IAM or open route with throttling + WAF).  
3. User registers/logs in (Cognito User Pool).  
4. Access/ID/Refresh tokens issued (JWT).  
5. Client sends Authorization: Bearer <access_token>.  
6. API Gateway JWT Authorizer validates token (signature, claims).  
7. Lambda enforces domain-level rules (ownership, premium entitlements).  
8. Premium media request obtains CloudFront Signed URL / Cookie (short TTL).  
9. Events logged & correlated (traceId).  

---

## 7. Security (Defense-in-Depth)

Layer | Control
------|--------
Edge | CloudFront + WAF (managed rule groups, rate-based rules)
AuthN/AuthZ | Cognito (MFA for privileged groups), JWT claims, Lambda domain checks
Application | Input validation, structured logging, least-priv privilege
Data | DynamoDB / S3 / Aurora encryption (KMS), PITR
Secrets | Secrets Manager (rotation), Parameter Store (non-secret)
Monitoring | GuardDuty, Security Hub, Config, CloudTrail, anomaly detection
Resilience | Versioning, PITR, replication, Step Functions retries
Governance | Tag enforcement, SCPs, cost budgets, drift detection

---

## 8. Observability & Operations

Category | Practice
---------|---------
Logging | JSON format, correlationId inserted at edge
Metrics | p50/p90/p95 latency, error %, throttles, cold start count
Tracing | X-Ray segments for API/Lambda/DynamoDB
Dashboards | CloudWatch unified SLO dashboards
Alarms | Error budget consumption, latency threshold breach, cost anomaly
Synthetics | Scripted login → search → premium media retrieval
RUM | Core Web Vitals (LCP, TTFB, CLS) & session timings
Cost Optimization | Budgets, anomaly detection, monthly FinOps review
Resilience Testing | Quarterly DR drills + chaos (throttle injection, permission denial)
Retention | Log retention 14–30 days hot, archived to S3/Glacier

---

## 9. Disaster Recovery & Resilience (Full Strategy)

### Objectives
- Keep Tier 0 services available.
- RPO seconds for operational data.
- Phased approach (baseline → intermediate → selective active‑active).

### Tier Classification
Tier | Services
-----|---------
0 | Public/premium listing read, login, media
1 | Listing create/update, favorites, broker dashboards
2 | Advanced search, analytics/reporting
3 | AI valuation, recommendations, batch enrichment

### Baseline RTO/RPO Matrix

Component | RTO | RPO | Strategy
----------|-----|-----|---------
Static (S3+CF) | <5 min | Near-zero | Versioning + SRR + invalidation
DynamoDB | Minutes | Seconds | PITR + on-demand backups + weekly export
Aurora (opt) | 5–15 min | <5 min (with replica) | Cross-region replica or snapshot
Media (S3) | <15 min | Near-zero | Versioning + SRR (CRR optional)
API/Lambda | Seconds | N/A | Stateless redeploy via IaC
Cognito | Managed | Managed | Multi-AZ AWS service
EventBridge/SQS/SNS | Seconds–Minutes | Near-zero | Durable multi-AZ
OpenSearch (opt) | Hours | Snapshot interval | Snapshot restore or degrade mode

### DR Strategy Options

Option | Description | RTO Target | Complexity
-------|-------------|-----------|-----------
1 Baseline | Single region, PITR, SRR, manual redeploy | Minutes–Hours | Low
2 Intermediate | Add CRR, selected Global Tables, Aurora replica | <15 min | Medium
3 Selective Active-Active | Multi-region active for core tables | <5–10 min | High

### Key Mechanisms
- DynamoDB: PITR 35 days + weekly Parquet export to S3.
- S3: Versioning + SRR baseline; CRR premium decision based on business risk.
- Aurora: Only deploy if relational complexity emerges; add replica for Option 2.
- IaC: Complete reproducibility (CDK/Terraform).
- Validation: Monthly restore test (automated), quarterly DR Game Day.

---

## 10. S3 Versioning, Replication & Lifecycle

Bucket | Versioning | Replication | Lifecycle (Sample) | Purpose
-------|------------|-------------|--------------------|--------
raw-uploads | Enabled | SRR + optional CRR | Noncurrent → IA (30d) → GDA (90d) | Rapid rollback, ingest staging
public-media | Enabled | SRR | Keep 3 recent versions; older → GDA (180d) | Cost-opt + rollback
premium-media | Enabled | SRR + optional CRR | Noncurrent → IA (30d) → GDA (120–180d) | High-value content protection

Controls: Block Public Access ON; OAC enforced; separate KMS keys; weekly S3 Inventory; replication metrics.

---

## 11. Cost Model (Approximate Monthly USD)

Scenario:  
Dev: 50K page views; 10K API calls/day; 200GB media  
Launch: 500K page views; 150K API calls/day; 1TB media  
Growth: 5M page views; 1M API calls/day; 6TB media; advanced search  

Component | Dev | Launch | Growth (Aurora+Search)
----------|-----|--------|-----------------------
S3 (w/versioning) | ~$6 | ~$34 | ~$192
CloudFront | ~$10 | ~$91 | ~$880
Lambda | ~$0.07 | ~$0.99 | ~$6.6
API Gateway (HTTP) | ~$0.30 | ~$4.50 | ~$30
DynamoDB | ~$1.4 | ~$7.8 | ~$49
Aurora Serverless v2 (opt) | ~$43 | ~$86 | ~$215
Cognito | $0 | $0 | ~$550
WAF | ~$10 | ~$10–12 | ~$15–20
Security (GuardDuty etc.) | $15–25 | $60–80 | $150–250
CloudWatch | ~$20 | ~$120 | ~$400
Location Service | ~$5 | ~$40 | ~$250
Media Processing | ~$5 | ~$60 | ~$300
OpenSearch (opt) | n/a | n/a | ~$120–150
TOTAL (with opt) | ~135–150 | ~430–480 | ~2,900–3,150
Core Only | ~92–107 | ~344–394 | ~2,500

(Validate pricing before financial commitments.)

---

## 12. On-Prem / Traditional vs Serverless

Aspect | Traditional | Serverless (This Architecture)
-------|-------------|--------------------------------
Provisioning | Hardware procurement & delays | Immediate managed services
Scaling | Manual, coarse increments | Automatic per request
Ops Staffing | SysAdmins, DBAs, network engineers | Minimal cloud ops + dev
Capital & Idle Cost | High idle overhead | Pay-as-you-go
Resilience | Complex multi-DC design | Built-in multi-AZ + staged DR
Security Patching | Manual cycles | AWS managed base layers
Innovation Velocity | Slower (infra gating) | Fast (IaC + event-driven)
Global Delivery | Additional CDN complexity | Native CloudFront edge
Lock-In Risk | Hardware sunk | Logical abstraction + open formats
Time to Market | Longer | Weeks

---

## 13. Recommendations & Best Practices (Prioritized)

Priority | Recommendation
---------|---------------
P1 | Approve baseline architecture (Option 1 DR).
P1 | Enable S3 Versioning + SRR + lifecycle now.
P1 | DynamoDB PITR + weekly export/integrity job.
P1 | Set Budgets + Anomaly Detection + tag enforcement.
P1 | Implement structured logging & tracing from earliest deploy.
P2 | Adopt EventBridge for core domain events.
P2 | Add synthetic user journeys & SLO-based alarms.
P2 | Draft DR runbooks; schedule first drill within 60 days.
P3 | Defer Aurora/OpenSearch until complexity validates.
P3 | Implement geohash filtering + metrics for search upgrade decision.
P3 | Plan AI valuation only after sufficient data volume.
P4 | Introduce caching (DAX) only if latency SLO risk emerges.
P4 | Add AppConfig feature flags for safe incremental rollout.

---

## 14. Implementation Milestones (16-Week Plan)

Phase | Weeks | Deliverables
------|-------|-------------
Foundation | 1–3 | IaC baseline (Cognito, API, DynamoDB, S3, WAF, budgets)
Media & Auth | 4–6 | Media pipeline (images), signed URL issuance, Step Functions scaffolding
Security & DR | 7–8 | PITR test, SRR configured, lifecycle policies, backup integrity job
Performance & Cost | 9–10 | Dashboards, error/latency alarms, cost optimization practices
Enhancements | 11–12 | Favorites, premium entitlements, broker dashboards, EventBridge events
Stabilize | 13 | DR Drill #1, index refinement
Launch Prep | 14–15 | Load testing, WAF tuning, security review
Go-Live | 16 | Production cutover + 48h hypercare

---

## 15. Extended Comprehensive Technical Q&A Catalogue (Full)

### 15.1 Architecture & Design
Q1: Why serverless instead of containerized microservices initially?  
A: Eliminates infrastructure management, scales per request, lowers idle cost, accelerates delivery; event-driven design still allows future microservice extraction.

Q2: How do we avoid vendor lock-in?  
A: Domain logic isolated; data exported in open formats (JSON/Parquet); IaC templates portable; minimal use of proprietary-only features early.

Q3: Can we convert to microservices later?  
A: Yes—EventBridge events and single-responsibility Lambdas allow gradual extraction to containers (ECS/EKS) without breaking consumers.

Q4: Why not start with GraphQL?  
A: REST via HTTP API is cheaper and simpler for MVP; GraphQL added later if client query flexibility/over-fetch issues appear.

Q5: When to use Step Functions?  
A: For multi-step, stateful workflows (media processing, moderation). Simple CRUD remains direct Lambda to avoid overhead.

### 15.2 Performance & Scalability
Q6: How do we handle sudden traffic spikes (launch campaign)?  
A: CloudFront caching reduces origin load; Lambda concurrency auto-scales; DynamoDB on-demand automatically adjusts capacity.

Q7: How to mitigate cold starts?  
A: Use lightweight runtimes, bundle pruning (esbuild), minimal dependencies; apply Provisioned Concurrency only to latency-sensitive endpoints.

Q8: When to add a caching layer (DAX/Redis)?  
A: Only once metrics show p95 latency or throttling from repeated hot key access beyond acceptable SLO.

Q9: How are performance SLOs enforced?  
A: CloudWatch metrics + alarms; error budgets track SLO breaches; synthetic tests confirm user journey latencies.

### 15.3 Security & Compliance
Q10: How is premium media protected?  
A: CloudFront Signed URLs/Cookies (short TTL) + OAC restricting S3; optional watermarking.

Q11: How do we prevent bots scraping premium listings?  
A: WAF bot rules, rate limiting, anomaly detection, dynamic signed tokens, optional watermark overlay.

Q12: Where are secrets stored and rotated?  
A: Secrets Manager (automatic rotation, especially for Aurora); Parameter Store for non-secret configuration.

Q13: What encryption strategies are used?  
A: All data encrypted at rest (KMS) and in transit (TLS 1.2/1.3); sensitive fields optionally envelope-encrypted client-side if required.

Q14: How is MFA enforced for brokers/admins only?  
A: Cognito groups + policies or Lambda triggers (PreTokenGeneration) requiring MFA for specific roles.

Q15: How is least privilege maintained?  
A: Dedicated IAM role per function; policy linters (cfn-nag, Access Analyzer); no wildcard actions except where unavoidable with explicit resource constraints.

### 15.4 Authentication / Authorization
Q16: Are social logins supported?  
A: Yes, configure IdPs (Google, Apple, Facebook) in Cognito; map attributes to standard claims.

Q17: Safe guest browsing approach?  
A: Identity Pool un-auth role limited to read-only public listing endpoints; or open endpoint with WAF + throttling for simple GETs.

Q18: How is property update authorization enforced?  
A: BrokerId claim in JWT must match property record brokerId; Lambda conditional logic; failures return 403.

### 15.5 Data Modeling / Consistency
Q19: Are multi-item atomic updates supported?  
A: DynamoDB TransactWriteItems for small batch atomic operations; Step Functions + compensation for larger workflows.

Q20: How do we prevent stale overwrites?  
A: Use version attribute with conditional write (expected version) to ensure optimistic concurrency.

Q21: How are daily views tracked?  
A: Partitioned by propertyId and date (VIEWSTAT#YYYY-MM-DD); aggregated later in analytics pipeline.

### 15.6 Geospatial & Search
Q22: Why not use Location Service for full advanced search?  
A: Location Service is for geocoding/maps; not multi-attribute ranking or fuzzy search—OpenSearch or custom solution needed for complex queries.

Q23: Early stage “within radius” approach?  
A: Geohash + bounding box approximation with GSI queries + server-side refinement; later upgrade to OpenSearch geo_distance queries.

Q24: When to adopt OpenSearch?  
A: When search complexity (facets, fuzzy, scoring) increases operational cost or complexity in DynamoDB beyond maintainability.

### 15.7 Media & CDN
Q25: How to prevent hotlinking?  
A: Signed URLs/Cookies + OAC + referrer checks (optional) + rotation of signing keys.

Q26: Large video optimization?  
A: MediaConvert for multi-bitrate streaming (HLS/DASH) + caching at CloudFront; store thumbnails for quick listing loads.

Q27: Handling 360° tours?  
A: Pipeline to preprocess & tile; store tile assets; adopt specialized SaaS only if advanced VR hotspots required.

Q28: Image performance strategy?  
A: Store multiple resolutions & formats (WebP/AVIF) via Lambda transformation; client selects optimal variant (responsive srcset).

### 15.8 Observability & Reliability
Q29: How are slow requests diagnosed?  
A: X-Ray traces + structured logs filtering by latency > threshold + correlation IDs.

Q30: Detect unusual delete events?  
A: CloudTrail Data Events + EventBridge pattern triggers -> alert if threshold of deletions in interval exceeded.

Q31: Initial SLO examples?  
A: Listing Read p95 < 250ms (cached) / < 400ms (uncached); Error rate < 1%; Availability 99.9%.

### 15.9 DR / Backups
Q32: RPO for DynamoDB corruption?  
A: Seconds via PITR to timestamp immediately before corruption.

Q33: Backup integrity verification?  
A: Monthly automated restore to temp table; compare item counts and hashed aggregates; report anomalies.

Q34: Region outage response baseline?  
A: Manual restore + redeploy (Option 1); improved failover (<15min) with Option 2 global replication.

Q35: OpenSearch outage fallback?  
A: Degrade to DynamoDB basic filtering until index restored.

### 15.10 Cost & Optimization
Q36: Primary early cost drivers?  
A: CloudFront bandwidth, S3 storage growth, potential Aurora adoption, CloudWatch logs if unbounded.

Q37: Prevent log cost bloat?  
A: Strict retention, log level governance, metric filters for sampling heavy events, export & compress to S3.

Q38: DynamoDB cost optimization trigger?  
A: On-demand cost consistently > equivalent provisioned by ~30–40% for a steady period.

Q39: Minimize CloudFront invalidations?  
A: Hash-based asset versioning; only invalidate HTML or root manifest files.

### 15.11 Governance & Operations
Q40: Tag enforcement method?  
A: SCP or pipeline hook rejecting untagged resources; AWS Config rule compliance audit.

Q41: Environment secret segregation?  
A: Distinct Secrets Manager entries per environment; cross-account isolation through multi-account structure.

Q42: Key incident response roles?  
A: Incident Commander, Recovery Engineer (Data), Recovery Engineer (API), Security Analyst, Communications Lead.

### 15.12 CI/CD & Testing
Q43: Ephemeral environments strategy?  
A: PR triggers stack creation; after tests/merge, stack destroyed to reduce cost.

Q44: Separation of unit & integration tests?  
A: Unit tests run on build; integration tests against ephemeral stack with seeded sample data set.

Q45: Cold start performance monitoring?  
A: Log init duration metric; compare p50 vs p95; apply Provisioned Concurrency if consistent user-visible latency impact.

### 15.13 Feature Roadmap / Extensibility
Q46: Subscription tiers expansion path?  
A: Claims (subscriptionLevel) + route gating + usage metrics for upsell prompts.

Q47: AI-driven recommendations plan?  
A: Collect engagement events via EventBridge → S3 analytics dataset → train (SageMaker/Bedrock) → real-time scoring Lambda.

Q48: International expansion strategy?  
A: Parameterized region endpoints; evaluate adding global tables & multi-region CloudFront failover; content localization pipeline.

### 15.14 Compliance / Privacy
Q49: Right-to-erasure implementation?  
A: Step Functions workflow enumerating user-linked items; transactional deletes; anonymize aggregate stats.

Q50: Immutable audit logs?  
A: CloudTrail & security logs exported to S3 bucket with Object Lock (WORM) + dedicated retention policy.

Q51: Data residency considerations?  
A: Primary region (ap-south-1); document reasoning, encryption, and access controls; monitor regulation changes for Nepal localization requirements.

### 15.15 Multi-Tenancy / Access
Q52: Adding partner agencies?  
A: Introduce tenantId partition scheme; per-tenant IAM policy boundaries & application-level filters.

Q53: Prevent cross-tenant data exposure?  
A: Strict composite keys (tenant prefix) + conditional checks + mandatory tenant claim in every request.

### 15.16 Rate Limiting / Abuse
Q54: API abuse defense?  
A: API Gateway throttling, WAF rate-based rules, dynamic deny list, anomaly detection from metrics.

Q55: Premium overuse mitigation?  
A: Track per-user premium media access; enforce soft limits; prompt upgrade or apply temporary throttle.

### 15.17 Migration / Legacy Data
Q56: Import legacy data process?  
A: Legacy dataset → S3 → transformation Lambda → DynamoDB batch writes (idempotent) → events for derived processing.

Q57: Idempotency strategy for imports?  
A: Natural unique legacy ID; conditional put (attribute_not_exists) + idempotency key logs.

### 15.18 Edge / Latency
Q58: Latency improvements beyond CDN?  
A: CloudFront Functions for quick personalization; optimizing JS bundle (code splitting); compress images/JSON.

Q59: Will multi-region materially improve Nepal latency?  
A: Minimal vs Mumbai POP performance; multi-region pursued primarily for DR/uptime SLA, not raw latency at current geography.

### 15.19 Additional / Misc
Q60: Drift detection approach?  
A: Regular CDK diff / Terraform plan audits + AWS Config drift detection & CI gating.

Q61: Deployment rollback method?  
A: Lambda versions + aliases; immutable asset versioning; retain last stable IaC template for quick revert.

Q62: Large property image set handling?  
A: Parallel signed uploads; asynchronous pipeline; concurrency throttling to manage cost & CPU.

Q63: Scope of DR not overbuilt?  
A: Option 1 baseline keeps complexity low; advanced options gated by RTO/RPO business justification.

---

## 16. DR Runbook Summary (Condensed Table)

Scenario | Core Steps | Success Metric
---------|------------|---------------
DynamoDB Corruption | Identify time → PITR restore new table → update config → verify integrity → reconcile events | Data restored within defined RPO (seconds)
Region Outage (Opt2+) | Trigger failover → promote DR resources / use Global Table → DNS/origin update → health checks | Tier 0 restored <15m
S3 Mass Deletion | Recover via versioning (remove delete markers) or replicate from SRR/CRR → refresh cache | Asset 200 responses restored
Credential Compromise | Revoke credentials → rotate secrets/KMS if risk → forensic snapshot → redeploy secure stack | Compromise contained
OpenSearch Failure | Switch to DynamoDB basic filter fallback → restore snapshot | Search continuity (degraded) maintained

---

## 17. Immediate Action Items

# | Action | Owner | Target
--|--------|-------|-------
1 | Architecture sign-off | CTO/Investors | Week 1
2 | Choose IaC (CDK/Terraform) | Lead Dev | Week 1
3 | Provision accounts + SCP guardrails | Cloud Admin | Week 1
4 | Create S3 buckets (Versioning+SRR+OAC) | DevOps | Week 2
5 | DynamoDB table + PITR + export pipeline | Backend | Week 2
6 | Cognito pools (User & Identity) | Backend | Week 3
7 | Core CRUD APIs | Backend | Week 3
8 | Media pipeline MVP (images) | Backend | Week 5
9 | Logging & X-Ray instrumentation | DevOps | Week 5
10 | WAF baseline + budgets/anomaly detection | Security | Week 5
11 | DR runbooks + PITR restore test | DevOps | Week 6
12 | Synthetic tests (login/search/media) | QA | Week 6
13 | Schedule DR Drill #1 | PM | Week 6
14 | Finalize lifecycle policies & validate | DevOps | Week 7
15 | Launch readiness review | PM | Week 15

---

## 18. Optional Future Enhancements
- OpenSearch (faceted & fuzzy search).
- AppSync GraphQL API.
- AI property valuation (SageMaker/Bedrock).
- Personalized recommendations (Bedrock/Personalize).
- Edge personalization (CloudFront Functions).
- Feature flags & A/B (AppConfig).
- Global Table / CRR for multi-region resilience.
- Data lake & Redshift for advanced BI.
- Computer vision tagging (image recognition).
- Real-time chat / presence (AppSync/WebSockets).

---

## 19. Why AWS vs Other Clouds (Comparative Rationale)

Dimension | AWS Advantage | Comparative Note (Azure/GCP)
----------|---------------|------------------------------
Regional Proximity | ap-south-1 (Mumbai) + dense CloudFront POP footprint | Similar India regions exist; AWS edge density strong for South Asia.
Serverless Maturity | Lambda, Step Functions, EventBridge deep integrated triggers | Azure Functions, GCP Cloud Run solid but fewer native trigger varieties.
Event Ecosystem | Broad event sources & partner events | Azure EventGrid & GCP Eventarc maturing.
Identity & Access | Cognito + API Gateway JWT + granular IAM | Azure AD B2C / Firebase viable; AWS unifies IAM + serverless triggers.
Security & Governance | Control Tower, Organizations, Config, Security Hub maturity | Azure Policy & GCP Org Policy strong; AWS multi-account patterns widely adopted.
Cost Governance | Budgets, Anomaly Detection, Cost Explorer tools depth | Parity improving elsewhere; AWS strong FinOps community assets.
Ecosystem Breadth | Vast marketplace & partner integrations | Others narrower for some prop-tech vertical tools.
Analytics Path | DynamoDB → S3 → Athena/Glue → Redshift flexibility | GCP BigQuery strong; AWS flexible multi-tier approach appeals for staged growth.
Lock-In Mitigation | Open formats + decoupled events minimize switching cost | Architectural discipline keeps risk low across clouds.

Conclusion: AWS accelerates secure MVP launch with comprehensive serverless, event, and governance tooling—supporting staged evolution without premature complexity.

---

## 20. Architecture Diagram (image.png) – Appraisal & Evolution

### Current Strengths
- Clear tier separation (Edge → API → Data).
- Serverless-first emphasis reduces ops overhead.
- Security layered (WAF, private origins).
- Multi-AZ depiction clarifies resilience.
- Inclusion of orchestration/process components.

### Improvement Opportunities
Gap | Enhancement
----|-----------
Event Backbone | Add explicit EventBridge icon & labeled event flows.
Media Lifecycle | Distinguish raw vs processed media buckets & pipeline.
Lifecycle/Versioning | Annotate S3 buckets with “Versioning + Lifecycle”.
Advanced Search | Add dashed OpenSearch (Phase 2).
Analytics Path | DynamoDB → S3 export arrow + Athena icon.
DR Option | Dashed note for Global Table / CRR (Phase).
Auth Flow | JWT validation arrow (Cognito → API Gateway Authorizer).
Feature Flags | AppConfig icon.
FinOps | Budgets/Cost Explorer icon.
AI/ML | Placeholder for future valuation/recommendation service.

### Evolution Timeline
Phase | Diagram Additions | Outcome
------|-------------------|--------
1 | Core stack | MVP validated quickly
2 | EventBridge & exports | Scalable feature delivery & analytics
3 | OpenSearch placeholder | Enhanced search readiness
4 | AI inference endpoint | Differentiated valuations/recommendations
5 | Global Table / CRR | Higher resilience & reduced downtime
6 | Feature flags & personalization | Faster experimentation
7 | FinOps & extended observability | Governance maturity & SLA reporting

---

## 21. AWS Adoption Summary
Adoption strategy: maximize managed services for speed & reliability; defer advanced search & AI until justified by user metrics; preserve flexibility through open data exports and event decoupling; strengthen governance incrementally (DR Option 2 only upon traction milestones).

---

## 22. Concluding Statement
This final architecture delivers a resilient, secure, and cost-aware foundation tailored to a luxury real estate marketplace, emphasizing rapid iteration and future extensibility. Phased enhancements (search, AI, global resilience) unlock only when validated needs emerge—minimizing premature spend while protecting strategic optionality.

---

## 23. Change Log
Version | Date | Summary
-------|------|--------
1.0 | Earlier | Initial consolidated architecture & DR
1.1 | Earlier | Integrated full extended Q&A (first pass)
1.2 | Earlier | Added AWS vs other clouds + diagram appraisal
1.3 | Earlier | Unified doc; Q&A summarized
1.4 | Current | Full Q&A explicitly included; final comprehensive version

---

End of Master Document.
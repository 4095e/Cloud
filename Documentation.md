# Luxury Real Estate Marketplace (Nepal)  
## MASTER ARCHITECTURE • DR • COST • AWS RATIONALE • Q&A DOSSIER

Version: 1.3 (Final Consolidated)  
Authoring Context: Consolidation of all prior responses (architecture blueprint, DR, cost model, AWS vs other clouds, diagram appraisal, extensive Q&A).  
Audience: Founders, Investors, Product Leadership, Light Dev/Ops, Security & Compliance Reviewers.

---

## 0. Executive Summary (One-Line)
A secure, event-driven, fully serverless, DR‑ready architecture on AWS enabling a premium luxury real estate marketplace with elastic cost, minimal operational overhead, and a phased path toward advanced search, analytics, and AI valuation.

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
14. Extended Comprehensive Technical Q&A Catalogue  
15. DR Runbook Summary (Condensed)  
16. Immediate Action Items  
17. Optional Future Enhancements  
18. Why AWS vs Other Clouds (Comparative Rationale)  
19. Architecture Diagram (image.png) Appraisal & Evolution Plan  
20. AWS Adoption Summary  
21. Concluding Statement  
22. Change Log  

---

## 2. Company & Product Overview (Corrected)
A luxury real estate development & brokerage entity operating in Kathmandu’s premium neighborhoods (Budhanilkantha, Bhaisepati, Sanepa, Dhumbarahi, Bansbari, Maharajgunj). Historically reliant on private investments, off‑market relationships, brokers—multi‑billion NPR turnover. Transition objective: institutionalize as a “Luxury Realtor Services” digital marketplace highlighting exclusive and high-value listings with rich immersive media (drone, 360° tours), establishing a premium brand presence and direct digital channel.

---

## 3. Business Objectives & Non-Functional Priorities
### Business Objectives
- Own platform for premium property listing, marketing and engagement analytics.
- Provide differentiated premium experiences (exclusive/off-market access).
- Support multi-role ecosystem (buyers, sellers/developers, brokers, admins, investors).
- Enable monetization via premium subscriptions and early-access tiers.
- Facilitate data-driven decision-making (pricing, demand insights).
- Launch fast with minimal ongoing infrastructure staffing.

### Ranked Non-Functional Priorities
1. Security & Data Integrity  
2. Availability & Performance (low latency for Nepal; region: ap-south-1)  
3. Elastic Cost (pay-per-use)  
4. Observability & Cost Transparency  
5. Extensibility (event-driven foundation)  
6. Maintainability with minimal full-time ops staff  

---

## 4. High-Level Serverless Architecture

### Edge / Presentation
Component | Detail
----------|-------
S3 (Static & Media) | Versioning enabled, SSE (SSE-S3 or SSE-KMS), Object Ownership enforced, Block Public Access.
CloudFront | OAC for S3 access; behaviors for /static, /media, /api; Signed URLs/Cookies for premium media; HTTP/3, Brotli, security headers (CSP, HSTS); optional CloudFront Functions.
Optional Edge Logic | CloudFront Functions (light), Lambda@Edge (only if heavy transformation needed).

### Application / API Layer
- API Gateway (HTTP API) for low-cost, JWT-native routing & throttling.
- AWS Lambda (Node.js for main CRUD, Python for data/ML tasks) using Powertools for tracing/logging/metrics.
- Step Functions for orchestrated multi-step flows (media ingestion, moderation, enrichment).
- EventBridge as central domain event bus (PropertyCreated, ListingApproved, MediaProcessed).
- SQS (buffer/retry decoupling), SNS (notification fan-out).
- AppConfig / Parameter Store for dynamic configuration toggles & features.
- Secrets Manager for credentials & rotation.

### Identity & Access
- Cognito User Pools: buyers, brokers, sellers, admins (groups & custom claims).
- Conditional MFA (brokers/admin) via group configuration or triggers.
- Cognito Identity Pool: unauthenticated guest access (scoped IAM).
- API Gateway JWT Authorizer + domain authorization enforced in function code.

### Data & Storage
- DynamoDB single-table (On-Demand → optional Provisioned + Auto Scaling later). PITR enabled.
- (Optional) Aurora Serverless v2 for relational/financial/reporting use cases when required.
- S3 buckets segregated: raw-uploads, public-media, premium-media (Versioning, SRR, optional CRR).
- Optional OpenSearch (Phase 2) for advanced full-text/geo/faceted search.
- Amazon Location Service for geocoding / maps.
- S3 Data Lake zone (DynamoDB exports → Parquet) for Athena/Glue analytics.

### Media Processing Pipeline
1. Client pre-signed upload → raw-uploads bucket.
2. S3 event → EventBridge / Step Functions pipeline.
3. Steps: validation → virus scan (optional) → image resizing (Sharp in Lambda) → video transcoding (MediaConvert) → metadata enrichment.
4. Outputs to public-media or premium-media; DynamoDB item updated; MediaProcessed event emitted.

### Security & Governance
- WAF (managed rule sets: Common, SQLi/XSS, IP reputation, Bot Control optional).
- Shield Standard (Advanced if volumetric DDoS risk).
- Strict least-privilege IAM (one role per Lambda function).
- KMS CMKs: separate keys (app data, media, logs).
- GuardDuty, Security Hub (CIS), AWS Config for compliance guardrails.
- CloudTrail (org-level + selective Data Events for cost control).
- Secrets Manager & Parameter Store separation of secrets vs config.

### Observability
- CloudWatch Logs (structured JSON), Metrics, Alarms with SLO thresholds.
- AWS X-Ray for tracing flows (API Gateway → Lambda → DynamoDB).
- Synthetics (login, property search, premium media retrieval).
- RUM (optional) for frontend performance & UX metrics.
- Budgets & Cost Anomaly Detection; Tag taxonomy (Environment, Owner, CostCenter, DataSensitivity).

### CI/CD & IaC
- CDK or Terraform (decision early).  
- Pipeline (CodePipeline / GitHub Actions) -> build -> tests -> deploy.  
- Multi-account: Sandbox, Dev, Staging, Prod via Organizations & SCPs.  
- Ephemeral PR stacks for integration tests.

### Extensibility
- Event-driven design simplifies future microservices or container transition.
- Future additions: OpenSearch, ML inference, AppSync GraphQL overlay, AI valuations, personalization.

---

## 5. Data Model (Illustrative DynamoDB Single-Table)

PK | SK | EntityType | Key Attributes (Sample)
---|----|------------|------------------------
USER#<UserId> | PROFILE | User | name, email, role, subscriptionLevel, createdAt
USER#<UserId> | FAVORITE#<PropertyId> | Favorite | createdAt
PROPERTY#<PropertyId> | METADATA | Property | price, status, brokerId, locationHash, premiumFlag, createdAt
PROPERTY#<PropertyId> | MEDIA#<MediaId> | Media | mediaType, s3Key, processingState
BROKER#<BrokerId> | PROFILE | Broker | licenseNo, rating
PROPERTY#<PropertyId> | VIEWSTAT#<Date> | DailyViewStat | viewCount
SUBSCRIPTION#<UserId> | ACTIVE | Subscription | tier, expiresAt

GSIs:  
- GSI1: premiumFlag + createdAt (latest premium)  
- GSI2: locationHash + priceBand (geo + price filtering)  
- GSI3: brokerId + status (broker dashboard)  
- GSI4: createdAt (global recent listing feed)

---

## 6. Authentication & Authorization Flow
1. Guest loads site via CloudFront.  
2. Public listing queries allowed with Identity Pool guest role OR open GET endpoint with WAF throttling.  
3. Registration/Login → Cognito User Pool (MFA enforced for privileged groups).  
4. Tokens (ID, Access, Refresh) returned.  
5. Client sends access token in Authorization header.  
6. API Gateway JWT Authorizer validates signature & claims.  
7. Lambda enforces resource-level authorization (ownership, premium subscription).  
8. Premium media request: signed URL or signed cookie issued (short TTL).  
9. Auditable events logged & emitted (EventBridge).  

---

## 7. Security (Defense-in-Depth Summary)
Layer | Control
------|--------
Edge | CloudFront + WAF managed rule groups, IP rate limiting
Auth | Cognito JWT + MFA for high-risk roles
App | Input validation, least-privilege Lambda roles
Data | DynamoDB/Aurora/S3 encryption (KMS), optional field-level encryption
Secrets | Secrets Manager rotation, Parameter Store for config
Network | Private Lambda networking only if needed; restrict egress (future)
Monitoring | GuardDuty, Security Hub, CloudTrail, Config, anomaly alerts
Recovery | Versioning, PITR, snapshots, replication
Governance | Tagging strategy, SCP guardrails, drift detection

---

## 8. Observability & Operations
Practice | Detail
---------|-------
Structured Logging | JSON; correlationId passed end-to-end
Metrics | Latency percentiles, error ratios, cold starts, DynamoDB capacity usage
Tracing | X-Ray segments & subsegments; Powertools instrumentation
Synthetics | Core flows: login → search → premium media
RUM | Performance metrics (LCP, TTFB, CLS)
Cost Controls | Budgets, Anomaly Detection, monthly FinOps review
Log Retention | 14–30 days hot; export to S3 + Glacier for long-term compliance
Game Days | Quarterly: simulate data corruption, throttling, partial media loss

---

## 9. Disaster Recovery & Resilience

### Objectives
- Minimize downtime for Tier 0 (public/premium listing reads, auth, media).
- RPO near-seconds for operational data (DynamoDB).
- Phased investment (baseline -> intermediate -> selective active-active).

### Tier Classification
Tier | Services
-----|---------
0 | Listing read, auth, media
1 | Listing create/update, favorites, broker dashboards
2 | Advanced search (OpenSearch), analytics/reporting
3 | AI valuation, recommendations, heavy batch

### Baseline RTO/RPO Matrix
Component | RTO | RPO | Method
----------|-----|-----|-------
Static (S3+CF) | <5 min | Near-zero | Versioning + SRR + invalidation
DynamoDB | Minutes | Seconds | PITR + on-demand backups + export to S3
Aurora (opt) | 5–15 min | <5 min (with replica) | Cross-region replica or snapshot restore
Media (S3) | <15 min | Near-zero | Versioning + SRR (+ optional CRR)
API/Lambda | Seconds | N/A | Stateless redeploy (IaC)
Cognito | Managed | Managed | AWS multi-AZ
EventBridge/SQS/SNS | Seconds–Minutes | Near-zero | Multi-AZ durability
OpenSearch (opt) | Hours | Snapshot interval | Snapshot restore / degrade fallback

### Strategy Options
Option | Description | RTO Target | Complexity
-------|-------------|-----------|-----------
1 Baseline | Single-region + PITR + SRR; manual failover | Minutes–Hours | Low
2 Intermediate | Add CRR + selected Global Tables + Aurora replica | <15 min | Medium
3 Selective Active-Active | Multi-region active (core tables) | <5–10 min | High

### Key Elements
- DynamoDB: PITR (35 days) + weekly exports (Parquet) for analytics & DR assurance.
- S3: Versioning + SRR; CRR only for high-value buckets (premium-media, raw-uploads).
- Aurora: Deploy only if relational demand validated; cross-region replica for Option 2.
- IaC: Full reproducibility; pre-bootstrapped DR region.
- Validation: Monthly restore test; quarterly DR drill.

---

## 10. S3 Versioning, Replication & Lifecycle

Bucket | Versioning | Replication | Lifecycle (Example) | Purpose
-------|------------|-------------|----------------------|--------
raw-uploads | Enabled | SRR + optional CRR | Noncurrent → IA (30d) → GDA (90d) | Fast ingest & rollback
public-media | Enabled | SRR | Keep 3 recent versions; older → GDA (180d) | Cost control & rollback
premium-media | Enabled | SRR + optional CRR | Noncurrent → IA (30d) → GDA (120–180d) | High-value asset protection

Controls: Block Public Access ON; OAC enforced; distinct CMKs; weekly S3 Inventory & replication metrics.

---

## 11. Cost Model (Approximate Monthly USD)

Scenario Assumptions:  
Dev: 50K page views; 10K API calls/day; 200GB media  
Launch: 500K page views; 150K API calls/day; 1TB media  
Growth: 5M page views; 1M API calls/day; 6TB media; advanced search  

Component | Dev | Launch | Growth (Aurora+Search)
----------|-----|--------|-----------------------
S3 (incl. versioning) | ~$6 | ~$34 | ~$192
CloudFront | ~$10 | ~$91 | ~$880
Lambda | ~$0.07 | ~$0.99 | ~$6.6
API Gateway (HTTP) | ~$0.30 | ~$4.50 | ~$30
DynamoDB | ~$1.4 | ~$7.8 | ~$49
Aurora Serverless v2 (opt) | ~$43 | ~$86 | ~$215
Cognito | $0 | $0 | ~$550 (beyond free 50K MAU)
WAF | ~$10 | ~$10–12 | ~$15–20
Security (GuardDuty, etc.) | $15–25 | $60–80 | $150–250
CloudWatch (logs/metrics) | ~$20 | ~$120 | ~$400
Location Service | ~$5 | ~$40 | ~$250
Media Processing | ~$5 | ~$60 | ~$300
OpenSearch (opt) | n/a | n/a | ~$120–150
TOTAL (with Aurora+Search) | ~135–150 | ~430–480 | ~2,900–3,150
Core Only (no Aurora/OpenSearch) | ~92–107 | ~344–394 | ~2,500

Notes: Validate with current AWS calculator before budgeting decisions.

---

## 12. On-Prem / Traditional vs Serverless

Aspect | Traditional | Serverless (This Architecture)
-------|-------------|--------------------------------
Provisioning | Hardware lead time | Instant managed services
Scaling | Manual & coarse | Automatic, fine-grained per request
Ops Staffing | SysAdmins, DBAs | Minimal (focus on features)
Capital & Idle Cost | High risk of over-provision | Pay-as-you-go
Resilience | Multi-DC complexity | Built-in multi-AZ; easy DR layering
Security Patching | Manual patch cycles | AWS managed base layers
Innovation Velocity | Slower | Rapid via IaC & event-driven pattern
Global Delivery | Additional engineering for CDN | Native CloudFront
Lock-In Risk | Hardware sunk cost | Logical abstraction + open data formats
Time to Market | Longer | Accelerated (weeks)

---

## 13. Recommendations & Best Practices (Prioritized)

Priority | Recommendation
---------|---------------
P1 | Approve serverless baseline (Option 1 DR).
P1 | Enable S3 Versioning + SRR with lifecycle policies now.
P1 | DynamoDB PITR + weekly export pipeline & integrity check.
P1 | Cost guardrails: Budgets + Anomaly Detection + tag enforcement.
P1 | Structured logging + X-Ray instrumentation from first deploy.
P2 | EventBridge domain events for property lifecycle & media.
P2 | Synthetic journeys (login, search, premium media) & error SLO alarms.
P2 | Draft DR runbooks & schedule first DR drill (≤60 days).
P3 | Defer Aurora/OpenSearch until complexity justifies.
P3 | Geohash indexing & metrics before search expansion.
P3 | Plan AI valuation after dataset maturity.
P4 | Introduce caching (DAX) only if latency SLO risk emerges.
P4 | Add feature flags (AppConfig) for safe experimentation.

---

## 14. Implementation Milestones (16-Week Plan)

Phase | Weeks | Deliverables
------|-------|-------------
Foundation | 1–3 | IaC baseline (Cognito, API, DynamoDB, buckets, WAF, budgets)
Media & Auth | 4–6 | Media pipeline (images), signed URL logic, Step Functions skeleton
Security & DR | 7–8 | PITR verification, S3 SRR, lifecycle policies, backup export integrity job
Performance & Cost | 9–10 | Dashboards, SLO alarms, log retention optimization
Enhancements | 11–12 | Favorites, premium entitlements, broker dashboards, EventBridge events
Stabilize | 13 | DR Drill #1, index refinement
Launch Prep | 14–15 | Load testing, WAF tuning, security review
Go-Live | 16 | Production cutover & 48h hypercare

---

## 15. Extended Comprehensive Technical Q&A
(Full integrated catalogue preserved. For brevity only section titles here—details retained from prior compilation.)

Sections:  
13.1 Architecture & Design  
13.2 Performance & Scalability  
13.3 Security & Compliance  
13.4 Authentication / Authorization  
13.5 Data Modeling / Consistency  
13.6 Geospatial & Search  
13.7 Media & CDN  
13.8 Observability & Reliability  
13.9 DR / Backups  
13.10 Cost & Optimization  
13.11 Governance & Operations  
13.12 CI/CD & Testing  
13.13 Feature Roadmap / Extensibility  
13.14 Compliance / Privacy  
13.15 Multi-Tenancy / Access  
13.16 Rate Limiting / Abuse  
13.17 Migration / Legacy Data  
13.18 Edge / Latency  
13.19 Additional (rollback, large images, DR scope)  

(Complete Q&A list available in v1.2; unchanged and fully adopted.)

---

## 16. DR Runbook Summary (Condensed)

Scenario | Core Steps | Success Metric
---------|------------|---------------
DynamoDB Corruption | Identify corruption time → PITR restore new table → re-point config → verify & reconcile | Data restored within RPO seconds
Region Outage (Opt2+) | Trigger failover → promote DR resources / use Global Table → update DNS/origin → verify health | Tier 0 <15m RTO
S3 Mass Deletion | Restore versions or replicate copy → cache invalidation if needed → confirm asset availability | 200 responses restored
Credential Compromise | Revoke keys → rotate secrets/KMS if required → forensic snapshot → redeploy | Compromised access removed
OpenSearch Failure | Switch to fallback DynamoDB filters → restore snapshot/test cluster | Core search continuity

---

## 17. Immediate Action Items

# | Action | Owner | Target
--|--------|-------|-------
1 | Architecture sign-off | CTO/Investors | Week 1
2 | Choose IaC framework (CDK vs Terraform) | Lead Dev | Week 1
3 | Provision AWS accounts & SCP guardrails | Cloud Admin | Week 1
4 | Create S3 buckets with Versioning/SRR & OAC | DevOps | Week 2
5 | DynamoDB table + PITR + export pipeline | Backend | Week 2
6 | Cognito User & Identity Pools | Backend | Week 3
7 | Core CRUD APIs (properties/users) | Backend | Week 3
8 | Media pipeline (image MVP) | Backend | Week 5
9 | Logging & X-Ray instrumentation | DevOps | Week 5
10 | WAF + budgets + anomaly detection | Security | Week 5
11 | Draft DR runbooks + PITR test | DevOps | Week 6
12 | Synthetic tests (login/search/media) | QA | Week 6
13 | Schedule DR Drill #1 | PM | Week 6
14 | Lifecycle policies final verification | DevOps | Week 7
15 | Launch readiness review | PM | Week 15

---

## 18. Optional Future Enhancements
- OpenSearch (faceted search, fuzzy matching)
- AppSync GraphQL for flexible client queries
- AI valuation (SageMaker/Bedrock)
- Recommendations (Bedrock/Personalize)
- Edge personalization (CloudFront Functions)
- Feature flags (AppConfig), A/B testing
- Global Table / CRR (multi-region resilience)
- Data lake analytics (Athena → Redshift)
- Computer vision tagging for media
- Real-time chat & viewer counters (AppSync/WebSockets)

---

## 19. Why AWS vs Other Clouds

Dimension | AWS Advantage | Note vs Azure/GCP
----------|---------------|------------------
Regional Proximity | ap-south-1 near Nepal; broad CloudFront POP coverage | Comparable India regions exist, but AWS POP density strong.
Serverless Maturity | Lambda, Step Functions, EventBridge deep integration | Azure Functions & GCP Cloud Run good; AWS event source breadth wider.
Event Ecosystem | Native, consistent eventing across services | Azure EventGrid & GCP Eventarc improving; AWS early maturity edge.
Identity Integration | Cognito + API Gateway JWT native flow | Azure AD B2C & Firebase are solid; AWS stack cohesive here.
Operational Tooling | CDK/Terraform adoption, SAM, Powertools | Others have IaC; AWS ecosystem & community patterns prolific.
Security & Governance | Organizations, Control Tower, Config, Security Hub standard | Azure Policy & GCP Org Policy strong; AWS multi-account patterns battle-tested.
Marketplace & Partners | Large South Asia partner presence & integrations | Azure & GCP have marketplaces; breadth tilts to AWS.
Cost Governance | Budgets, Anomaly Detection, granular cost allocation tags | Others have cost tools; AWS FinOps community breadth is high.
Data & Analytics Path | DynamoDB → S3 → Athena/Glue/Redshift seamless | GCP BigQuery offers strong analytics, but AWS path flexible.
Lock-In Mitigation | Open formats & event-driven modular architecture | Equivalent strategies feasible elsewhere; AWS breadth reduces need for proprietary leaps early.

Conclusion: AWS accelerates time-to-market with minimal ops overhead, broad native integrations, and a staged path to advanced capabilities while preserving exit optionality via open data formats & clean event boundaries.

---

## 20. Architecture Diagram (image.png) – Appraisal & Evolution

### Current Strengths
- Clear 3-tier separation (Edge → API → Data).
- Emphasis on serverless (Lambda, API Gateway).
- Security boundary depiction (WAF, IAM).
- Multi-AZ conceptual clarity.
- Inclusion of processing pipelines & data stores.

### Improvement Opportunities
Gap | Enhancement
----|------------
Event Backbone | Explicit EventBridge icon & labeled flows
Media Lifecycle | Visual separation of raw vs processed buckets
Lifecycle/Versioning | Annotate buckets with “Versioning + Lifecycle”
Advanced Search | Dashed “OpenSearch (Phase 2)” placeholder
Analytics Path | Arrow from DynamoDB to S3 (export) + Athena icon
DR Enhancements | Dashed global replication note (Global Table / CRR)
Auth Flow | JWT verification arrow (Cognito → API Gateway Authorizer)
Feature Flags | AppConfig icon for progressive delivery
FinOps | Cost Explorer/Budget icon for governance visibility

### Evolution Timeline (Diagram Layers)
Phase | Additions | Rationale
------|-----------|----------
1 (Now) | Core components only | MVP speed
2 | EventBridge annotations & data export | Scalability & analytics readiness
3 | OpenSearch (dashed) | Enhanced search UX once complexity validated
4 | AI/ML inference endpoint | Valuation & recommendations differentiation
5 | DR (Global Table/CRR) | Reduced downtime risk as SLA tightens
6 | Feature flags & personalization at edge | Faster experimentation & conversion
7 | FinOps & advanced observability icons | Mature governance & reliability metrics

### Diagram Notation Guidelines
- Solid border = implemented.
- Dashed border = planned/future.
- Color legend for categories: Security, Data, Compute, Workflow, Future.
- Phase labels to prevent scope creep.

---

## 21. AWS Adoption Summary
The architecture leverages AWS’s mature serverless ecosystem for rapid, secure launch while deliberately deferring higher-complexity, higher-cost components (search, AI, global replication) until KPIs justify them. The event-driven model plus open data export paths ensure strategic flexibility and controlled lock-in.

---

## 22. Concluding Statement
This finalized design balances rapid market entry, premium user experience, robust security, and disciplined cost governance. It lays a modular foundation for phased evolution—advanced search, analytics, AI valuation, multi-region resilience—activated only when data-driven thresholds and business milestones warrant expanded investment.

---

## 23. Change Log
Version | Date | Summary
-------|------|--------
1.0 | Earlier | Initial consolidated architecture & DR
1.1 | Earlier | Integrated full extended Q&A
1.2 | Earlier | Added AWS vs other clouds + diagram appraisal
1.3 | Final | Comprehensive final document (all components unified, TOC, minor editorial refinements)

---

End of Master Document.
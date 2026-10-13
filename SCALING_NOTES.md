# Architecture & Scaling Notes: Scaling Meme'd to 10,000+ Creators

This document outlines the architecture, scaling strategies, and system design optimizations required to scale the **Meme'd Campaign Payout Tracker** from hundreds of submissions to **10,000+ active creators** processing millions of view events daily.

---

## 1. High-Level Architecture at Scale

```
               +---------------------------------------+
               |     Cloudflare CDN / DDoS Shield      |
               +-------------------+-------------------+
                                   |
                     +-------------v-------------+
                     |    API Gateway (Nginx /   |
                     |       Kong / ALB)         |
                     +------+-------------+------+
                            |             |
           +----------------v---+     +---v----------------+
           | Next.js Frontend   |     | Express API Server |
           | (Edge / Vercel)    |     | (Auto-scaled ECS)  |
           +--------------------+     +---------+----------+
                                                |
               +--------------------------------+--------------------------------+
               |                                                                 |
     +---------v----------+                                            +---------v----------+
     | Fast Ingestion API |                                            | Read/Admin API     |
     | (Lightweight HTTP) |                                            | (GraphQL / REST)   |
     +---------+----------+                                            +---------+----------+
               |                                                                 |
     +---------v----------+                                                      |
     | Message Queue      |                                                      |
     | (Kafka / BullMQ)   |                                                      |
     +---------+----------+                                                      |
               |                                                                 |
     +---------v----------+                                                      |
     | Payout Workers     |                                                      |
     | (Consumer Pool)    |                                                      |
     +----+---------+-----+                                                      |
          |         |                                                            |
          |   +-----v----------------------+                       +-------------v------+
          |   | Redis Cluster              |                       | MongoDB Replica    |
          |   | - Distributed Lock         |<----------------------+ Set (Sharded)      |
          |   | - Campaign Budget Counters |                       | - Read Replicas    |
          |   | - Campaign Cache           |                       +--------------------+
          |   +----------------------------+
          |
     +----v--------------------+
     | Payout Ledger &         |
     | Audit Event Store       |
     +-------------------------+
```

---

## 2. Ingestion & Event Processing Bottlenecks

### The Problem
When 10,000 creators are actively participating in viral campaigns, view counts change rapidly. If view updates arrive every minute:
$$10,000 \text{ creators} \times 1 \text{ update/min} \approx 167 \text{ requests/sec}$$
During a viral campaign peak, this can spike to **5,000+ requests/second**. Direct synchronous MongoDB writes with atomic locks would saturate database CPU, cause thread contention, and risk write lock starvation.

### The Solution: Asynchronous Queue-Based Ingestion
1. **Decouple View Ingestion from Payout Calculations**:
   - The view ingestion endpoint (`PATCH /api/submissions/:id/views` or a platform webhook) validates the request and immediately pushes an event onto a high-throughput queue (e.g., **Kafka**, **AWS SQS**, or **BullMQ on Redis**).
   - Ingestion response is returned in `< 15ms` (`202 Accepted`).
2. **Batch Ingestion & Debouncing**:
   - Debounce updates for the same submission ID within a short sliding window (e.g., 5 seconds). Only the highest view count in that window is processed.
3. **Partitioned Workers**:
   - Queue events are partitioned by `campaignId` so that view events targeting the same campaign are processed in sequence by dedicated worker threads, eliminating cross-node lock contention on campaign budgets.

---

## 3. Concurrency Protection & Preventing Budget Overspend

### Current Implementation (Level 1)
In our current production service, we utilize **atomic MongoDB conditional writes with expression guards**:
```typescript
Campaign.findOneAndUpdate(
  {
    _id: campaignId,
    $expr: { $lte: [{ $add: ['$budgetSpent', actualPayout] }, '$totalBudget'] }
  },
  { $inc: { budgetSpent: actualPayout } },
  { new: true }
);
```
This guarantees **zero overspend** at the database layer without two-phase commit overhead.

### Scaled Implementation (Level 2: 10K+ Creators)
At 10,000+ concurrent creators:
1. **In-Memory Budget Counters via Redis Lua Scripting**:
   - Store `campaign:{id}:budget_remaining` in Redis.
   - Execute an atomic Lua script for instant budget reservation:
     ```lua
     local remaining = redis.call('get', KEYS[1])
     if not remaining or tonumber(remaining) <= 0 then
       return 0
     end
     local delta = tonumber(ARGV[1])
     local payout = math.min(delta, tonumber(remaining))
     redis.call('decrby', KEYS[1], payout)
     return payout
     ```
   - Redis evaluates Lua scripts in single-threaded microsecond operations, supporting **100,000+ ops/second** without database locks.
2. **Eventual Persistence via Write-Behind Ledger**:
   - Workers write individual payout records to a durable write-optimized append-only ledger (`PayoutLog`), and asynchronously reconcile MongoDB `budgetSpent`.

---

## 4. Database Scaling & Indexing Strategy

### MongoDB Sharding Key
- Shard the `submissions` collection on `{ campaign: 'hashed', creator: 1 }`.
- Compound indexes ensure queries by campaign or by creator resolve in `O(1)`:
  - `Submission.index({ campaign: 1, createdAt: -1 })`
  - `Submission.index({ creator: 1, createdAt: -1 })`
  - `Submission.index({ creator: 1, campaign: 1 }, { unique: true })` (idempotency guard)

### Read Replicas
- Configure MongoDB Atlas Primary + 2 Secondary replica nodes.
- Route brand dashboard queries and public campaign listings to Secondary nodes with `readPreference: 'secondaryPreferred'`.
- Reserve Primary exclusively for write transactions and atomic state updates.

---

## 5. Fraud Prevention & Spike Detection

### Multi-Stage Anomaly Detection
1. **Velocity Thresholds**:
   - Current implementation: Calculates `(newViews - prevViews) / timeDeltaSeconds`. If $> 100 \text{ views/sec}$, post is flagged.
2. **Machine Learning / Sliding Window Rate Limiting**:
   - Use Redis `ZADD` sliding windows to track view velocity over 1-minute, 15-minute, and 1-hour intervals.
   - Sudden parabolic leaps (e.g., $0 \to 500,000$ views in 2 minutes) place the payout in an `escrow_pending` status awaiting automated social platform API verification.
3. **Platform API Verification**:
   - For high payouts ($> ₹5,000$), call the official Instagram Graph API / YouTube Data API v3 asynchronously using encrypted API credentials before releasing funds.

---

## 6. High Availability, Caching & Resilience

| Tier | Component | Strategy |
|---|---|---|
| **Edge** | Cloudflare / Vercel Edge | Cache public campaign discovery responses (`stale-while-revalidate: 60`). |
| **App** | Node.js Clusters | Node.js cluster mode / Docker containers orchestrated on AWS ECS / Kubernetes. |
| **Cache** | Redis Cluster | Multi-node Redis with Sentinel failover for sub-millisecond campaign metadata reads. |
| **Resilience** | Circuit Breaker | `opossum` circuit breakers around database and external third-party view verification APIs. |

---

## 7. Cost Efficiency & Benchmark Projection

| Metric | Single Node (Current) | Scaled Distributed Architecture |
|---|---|---|
| Concurrent Creators | ~500 | **10,000 - 50,000+** |
| View Ingestion Rate | ~200 req/sec | **10,000+ req/sec** |
| Payout Latency (p99) | < 45 ms | **< 12 ms** (via Redis reservation) |
| Risk of Budget Overspend | **0%** (Atomic Mongo Guard) | **0%** (Redis Lua + Mongo Guard) |

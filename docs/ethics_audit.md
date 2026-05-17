# Ethics Audit Checklist

This checklist should be run before submission to confirm the system adheres to data minimisation and privacy principles.

## Principles Applied

| Principle | Implementation |
|-----------|----------------|
| **Data Minimisation** | Only aggregate headcounts and average ratings stored — no individual responses |
| **Anonymity** | Feedback table has no `text`, `name`, or `userId` column |
| **Group-level Forecasting** | All predictions are at `group_id` granularity — no individual-level inference |
| **Consent** | UI displays privacy notice before feedback submission |
| **Right to Erasure** | No personally identifiable feedback data is stored |

---

## SQL Audit Queries

Run these after `npx prisma migrate dev` and seeding:

```sql
-- 1. Confirm no names or text in features table
SELECT * FROM "Feature" LIMIT 10;
-- Expected: only numeric columns (rolling_avg_4w, trend_slope, rsvp_rate, feedback_avg)

-- 2. Confirm feedback has no free-text column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Feedback';
-- Expected: id, group_id, session_date, avg_rating (float), response_count (int), created_at
-- Must NOT contain: text, comment, name, user_id

-- 3. Confirm forecasts are group-level only
SELECT DISTINCT group_id FROM "Forecast";
-- Expected: only group IDs — no user_id or individual identifiers

-- 4. Confirm alerts have no individual references
SELECT message, recommendation FROM "Alert" LIMIT 10;
-- Expected: references to group context only, e.g. "Attendance may drop..."
-- Must NOT contain: individual names, email addresses, or user IDs

-- 5. Verify attendance uniqueness constraint (no duplicate data entry)
SELECT group_id, session_date, COUNT(*) c
FROM "Attendance"
GROUP BY group_id, session_date
HAVING COUNT(*) > 1;
-- Expected: 0 rows (enforced by @@unique constraint)
```

---

## Additional Safeguards

- **JWT-based RBAC**: Role-gated endpoints prevent members from accessing forecast or alert data
- **Aggregated feedback only**: `POST /api/feedback` validates `avgRating ∈ [1,5]` and `responseCount ≥ 1`
- **Seed accounts only**: No real user data in development; seed accounts use clearly labelled test credentials
- **ML models**: SVR models are trained on group-level time-series — not on individual member behaviour

---

## Pre-submission Checklist

- [ ] Run all 5 SQL audit queries above and confirm no PII columns
- [ ] Confirm ML `models/` directory only contains `.pkl` files (no raw data exports)
- [ ] Review all API route parameters: no `userId` in body of forecast/alert routes
- [ ] Confirm seed script uses synthetic Gaussian data, not real member records
- [ ] SUS score collected from ≥5 users and `sus_score(responses) >= 68`

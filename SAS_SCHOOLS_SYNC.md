# SAS Schools Sync

Pull registered schools from the SAS (School Accreditation System) API and
upsert them into the local `schools` table using Laravel queue batching.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Sync](#running-the-sync)
- [Monitoring](#monitoring)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Key Files](#key-files)

---

## Architecture Overview

```
sas:sync-schools            (Artisan command)
        │
        ▼
InitiateSasSchoolSyncJob    (probes page 1 → discovers total pages)
        │
        ▼
Bus::batch([
  FetchSasSchoolsPageJob(page=1),
  FetchSasSchoolsPageJob(page=2),
  ...                        (one job per page, run in parallel by workers)
  FetchSasSchoolsPageJob(page=N),
])
        │
        ▼
School::upsert()             (bulk upsert keyed on registration_number)
        │
        ▼
sas_sync_logs                (progress tracking table)
```

- **Queue:** `sas-sync` (dedicated queue, uses `database` driver)
- **Conflict key:** `registration_number` (unique per school in SAS)
- **Page size:** 500 records/page (default) — ~44 pages for 21,582 schools
- **Retries:** 3 per page job with exponential back-off (60s, 120s, 240s)
- **SSL:** SAS uses a self-signed cert on port 8097 — verification is skipped automatically

---

## Environment Setup

Add these to your `.env` file:

```env
SAS_API_URL=https://accredit.moe.go.tz:8097/api/get-registered-schools
SAS_API_KEY=
SAS_USERNAME=
```

> **Note:** These credentials are already configured in `config/services.php` under the `sas` key.

---

## Database Setup

Run all pending migrations (includes `schools`, `sas_sync_logs`, geo tables, and `ownership_types`):

```bash
php artisan migrate
```

To roll back and redo:

```bash
php artisan migrate:rollback --step=8
php artisan migrate
```

Pre-seed `ownership_types` before syncing so the sync can resolve
`school_ownership` strings (e.g. `"Government"`) to integer FK IDs:

```bash
php artisan db:seed --class=OwnershipTypeSeeder
```

---

## Running the Sync

### Step 1 — Dispatch the sync

```bash
# Default (500 records/page)
php artisan sas:sync-schools

# Custom page size
php artisan sas:sync-schools --page-size=200

# Cancel any in-progress sync and start fresh
php artisan sas:sync-schools --fresh
```

The command creates a `sas_sync_logs` entry and dispatches `InitiateSasSchoolSyncJob`
to the `sas-sync` queue. **Nothing runs until a worker is started.**

### Step 2 — Start a queue worker

```bash
# Recommended: both queues, fast (no sleep), cap at 5000 jobs per run
php artisan queue:work --queue=sas-sync,default --sleep=0 --max-jobs=5000

# Supervisor-friendly (restart every 500 jobs, 1 hour max)
php artisan queue:work --queue=sas-sync,default --sleep=3 --max-jobs=500 --max-time=3600

# Multiple workers in parallel (run in separate terminals / Supervisor processes)
php artisan queue:work --queue=sas-sync --sleep=0 --max-jobs=5000 &
php artisan queue:work --queue=sas-sync --sleep=0 --max-jobs=5000 &
php artisan queue:work --queue=sas-sync --sleep=0 --max-jobs=5000 &
```

> **Tip:** Run 3–5 parallel workers to process all pages concurrently.

---

## Monitoring

### Artisan status command

```bash
# Latest sync status
php artisan sas:sync-status
```

Output example:

```
+------------------+---------------------+
| Field            | Value               |
+------------------+---------------------+
| Log ID           | 3                   |
| Status           | RUNNING             |
| Batch ID         | 9a1f...             |
| Total Records    | 21,582              |
| Total Pages      | 44                  |
| Processed Pages  | 27                  |
| Failed Pages     | 0                   |
| Records Upserted | 13,500              |
| Progress         | 61%                 |
| Page Size        | 500                 |
| Started At       | 2026-03-22 09:00:00 |
| Finished At      | not finished        |
| Schools in DB    | 13,500              |
+------------------+---------------------+
```

### Database queries

```sql
-- Overall sync history
SELECT id, status, total_records, total_pages, processed_pages,
       inserted_records, failed_pages, started_at, finished_at
FROM sas_sync_logs
ORDER BY id DESC;

-- Count synced schools
SELECT COUNT(*) FROM schools;

-- Schools missing an ownership type link
SELECT COUNT(*) FROM schools WHERE ownership_type_id IS NULL;

-- Schools with no geo FK (ward/village not yet linked)
SELECT COUNT(*) FROM schools WHERE ward_id IS NULL;

-- Check latest failed jobs
SELECT id, queue, payload, exception, failed_at
FROM failed_jobs
WHERE queue = 'sas-sync'
ORDER BY failed_at DESC
LIMIT 10;
```

### Queue inspection

```bash
# Count pending jobs on the sas-sync queue
php artisan queue:monitor sas-sync

# View failed jobs
php artisan queue:failed

# Retry all failed jobs on sas-sync
php artisan queue:retry --queue=sas-sync

# Retry a specific failed job
php artisan queue:retry <job-id>

# Flush all failed jobs
php artisan queue:flush
```

---

## API Endpoints

All endpoints require JWT authentication (`Authorization: Bearer <token>`).

### Start a sync

```
POST /api/sas/sync
Content-Type: application/json

{
    "page_size": 500,   // optional, default 500, range 10–1000
    "fresh": false      // optional, set true to cancel running sync first
}
```

Response `202`:
```json
{
    "success": true,
    "message": "School sync initiated. Use GET /api/sas/sync/status to monitor progress.",
    "data": { "sync_log_id": 3 }
}
```

Error `409` (sync already running):
```json
{
    "success": false,
    "message": "A sync is already running. Pass fresh=true to cancel and restart."
}
```

---

### Get sync status

```
GET /api/sas/sync/status
GET /api/sas/sync/status?log_id=3    # specific run
```

Response `200`:
```json
{
    "success": true,
    "data": {
        "sync_log": { "id": 3, "status": "running", "total_records": 21582, ... },
        "progress": 61,
        "batch": {
            "id": "9a1f...",
            "total_jobs": 44,
            "pending_jobs": 17,
            "processed_jobs": 27,
            "failed_jobs": 0,
            "progress": 61,
            "finished": false,
            "cancelled": false
        }
    }
}
```

---

### Sync history

```
GET /api/sas/sync/history
GET /api/sas/sync/history?per_page=25
```

---

### Cancel a running sync

```
POST /api/sas/sync/{id}/cancel
```

Response `200`:
```json
{
    "success": true,
    "message": "Sync cancelled successfully"
}
```

---

## Troubleshooting

### SSL / connection errors

The SAS API is on port 8097 with a self-signed certificate. SSL verification is
disabled automatically in `SasSchoolSyncService`. If you still see errors:

```bash
curl -k -X POST https://accredit.moe.go.tz:8097/api/get-registered-schools \
  -H "Content-Type: application/json" \
  -d '{"username":"sqas","authKey":"673728deea3b720241115SASPKRDx34KfO","pageSize":1,"pageNo":1}'
```

### Jobs are not processing

```bash
# Confirm jobs are in the queue table
SELECT id, queue, available_at, created_at FROM jobs WHERE queue = 'sas-sync' LIMIT 5;

# Start a worker manually
php artisan queue:work --queue=sas-sync --sleep=0 --verbose
```

### "Unexpected SAS response" error in logs

Check `storage/logs/laravel.log` for the raw response body:

```bash
tail -f storage/logs/laravel.log | grep "SAS"
```

### Ownership types not resolving

If `ownership_type_id` is null for all schools, the `ownership_types` table is
likely empty. Seed it before (or after) syncing and re-run:

```bash
php artisan db:seed --class=OwnershipTypeSeeder
php artisan sas:sync-schools --fresh
```

### Re-run a sync without touching existing data

```bash
# Simply run again — upsert on registration_number overwrites changed fields
php artisan sas:sync-schools
php artisan queue:work --queue=sas-sync --sleep=0 --max-jobs=5000
```

### Clear all sync state and start completely fresh

```bash
php artisan sas:sync-schools --fresh
# Then in psql:
# TRUNCATE schools RESTART IDENTITY CASCADE;
# DELETE FROM sas_sync_logs;
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/Services/SasSchoolSyncService.php` | HTTP client + field mapper (SAS → schools table) |
| `app/Jobs/InitiateSasSchoolSyncJob.php` | Probes page 1, creates the Bus::batch |
| `app/Jobs/FetchSasSchoolsPageJob.php` | Fetches one page + bulk upserts |
| `app/Console/Commands/SyncSchoolsFromSasCommand.php` | `php artisan sas:sync-schools` |
| `app/Console/Commands/SasSyncStatusCommand.php` | `php artisan sas:sync-status` |
| `app/Http/Controllers/Api/SasSchoolSyncController.php` | REST API for sync management |
| `app/Models/SasSyncLog.php` | Progress tracking model |
| `app/Models/School.php` | School Eloquent model |
| `database/migrations/2026_03_22_000001_create_schools_table.php` | Schools schema |
| `database/migrations/2026_03_22_000002_create_sas_sync_logs_table.php` | Sync logs schema |
| `config/services.php` | SAS API credentials config (`sas.*`) |

---

## SAS API — Field Mapping Reference

| SAS Field | Our Column | Notes |
|-----------|-----------|-------|
| `registration_number` | `registration_number` | Unique conflict key for upsert |
| `school_name` | `name` | |
| `registration_status` | `registration_status` | |
| `registration_date` | `registration_date` | Parsed to date |
| `school_opening_date` | `school_opening_date` | Parsed to date |
| `school_phone` | `phone_number` | |
| `school_email` | `email_address` | |
| `po_box` | `postal_address` | |
| `school_address` | `physical_address` | |
| `stream` | `number_stream` | Cast to int |
| `area` | `size` | Land area in m², cast to float |
| `is_seminary` | `is_seminary` | Cast to bool |
| `ward_id` | `sas_ward_uid` | DHIS2 alphanumeric UID (not an integer FK) |
| `village_id` | `sas_village_uid` | DHIS2 alphanumeric UID (not an integer FK) |
| `location.latitude` | `latitude` | decimal(12,10) |
| `location.longitude` | `longitude` | decimal(12,10) |
| `location.street_tamisemi_id` | `street_tamisemi_id` | |
| `school_category.id` | `school_category_id` | |
| `school_gender_type.id` | `school_gender_type_id` | |
| `school_specialization.id` | `school_specialization_id` | |
| `school_ownership` | `ownership_type_id` | String resolved to FK via `ownership_types` table |
| *(not in SAS)* | `school_type_id` | Always null post-import |
| *(not in SAS)* | `school_classification_id` | Always null post-import |

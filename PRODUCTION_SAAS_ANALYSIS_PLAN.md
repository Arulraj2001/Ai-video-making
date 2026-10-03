# ScenoraEdits Production SaaS Analysis and Phased Upgrade Plan

**Date:** 2026-10-03  
**Scope:** `/app/projects`, `/app/create`, `/app/studio`, project persistence, media ingestion, rendering, downloading, authentication, deployment, and production SaaS readiness.  
**Review mode:** Terminal/source inspection only. No browser testing, code fixes, dependency changes, deployment, or test execution were performed.

## 1. Executive assessment

The application is a real full-stack prototype with substantial functionality already implemented, but it is not yet production-grade for reliable, repeatable video rendering and downloads at scale.

The strongest existing foundations are:

- React/Vite frontend with route-level lazy loading and TypeScript build checks.
- FastAPI backend with typed Pydantic schemas and Firebase ID-token authentication.
- Firebase Authentication, Firestore, and Cloud Storage integration.
- FFmpeg-based rendering with image normalization, scene compositing, captions, audio mixing, validation, retries, and render status endpoints.
- Owner-scoped Firestore and Storage rules.
- Existing frontend and backend test suites.
- Render and media persistence attempts that already account for server restarts in several metadata paths.

The highest-risk gaps are:

1. **Canvas selection is functionally disconnected from project creation.** `CreateProjectPage` stores `aspectRatio` in local state but does not include it in the `createProject` request. The backend `create_project` path also constructs a default `ProjectModel` without applying canvas settings. A user can select 9:16 or 1:1 and still receive the default canvas.
2. **Rendered video bytes are local to the Render service filesystem.** Render job metadata is synchronized to Firestore, but `output_path` points to `STORAGE_DIR`. A Render restart, redeploy, scale-out event, or instance change can leave a completed Firestore job with no downloadable file.
3. **Rendering is not a durable job queue.** Jobs are launched with `asyncio.create_task` or a daemon thread inside the web process. Work can be interrupted by deploys, crashes, autoscaling, timeouts, or multiple instances. There is no claim/lease/idempotency model for concurrent workers.
4. **The critical export path is CPU/memory/disk intensive inside a web service.** FFmpeg is invoked from the FastAPI service, with per-scene temporary MP4s and multiple passes. This creates latency, OOM, noisy-neighbor, and capacity risks.
5. **Exact-output guarantees are not formalized.** There is validation, but no documented render contract covering immutable input revisions, deterministic settings, source asset checksums, output checksums, color/audio/frame-rate policy, or a golden-file regression suite.
6. **The frontend error and async UX is not SaaS-grade in several core paths.** The create page uses `alert`, several API/auth error paths intentionally fall back silently, and the client needs consistent retry/backoff, cancellation, stale-job handling, and resumable download behavior.
7. **Deployment configuration is split across Firebase Hosting, Netlify, and Render.** This is workable, but it increases configuration drift and makes the canonical production path unclear.

## 2. Verified technology stack

### Frontend

- React 19
- TypeScript 6
- Vite 8
- `lucide-react`
- Firebase Web SDK 12
- Custom client-side router and React context/hooks state management
- `oxlint`
- Node test runner (`node --test`)
- Firebase Hosting as the declared primary static host (`firebase.json`)
- Netlify configuration also exists (`netlify.toml`)

### Backend

- Python 3.11.9 on Render (`render.yaml`)
- FastAPI and Uvicorn
- Pydantic 2
- Firebase Admin SDK
- Firestore for project/payment/usage/vault metadata
- Firebase Cloud Storage for durable source assets
- Local filesystem copies for render-time access and fallback
- Pillow for image normalization/compositing
- `imageio-ffmpeg` plus system FFmpeg discovery
- Edge TTS
- Cryptography for credential-vault encryption
- `pytest` and `httpx`

### Deployment topology

1. Firebase Hosting serves `frontend/dist` and rewrites SPA routes to `index.html`.
2. The frontend calls `https://scenoraedits.onrender.com` in production unless `VITE_API_BASE_URL` overrides it.
3. Render runs one Python web service from `backend` using Uvicorn.
4. Firebase Authentication supplies browser ID tokens.
5. Firestore and Cloud Storage provide durable cloud data paths.

## 3. Core flow review

### `/app/projects`

**Implemented:**

- Authenticated project listing.
- Search filtering.
- Loading and error states.
- Project selection and navigation to studio.
- Delete confirmation and owner-scoped delete API.
- Aspect-ratio badge sourced from project state.

**Risks/gaps:**

- Filtering is client-side over the full project list; pagination, server-side search, and virtualization are absent.
- `confirm()` is used for deletion rather than a controlled accessible confirmation dialog.
- Delete failure is not visibly handled in the page-level handler.
- The list uses `toLocaleDateString()` without an explicit timezone/locale contract.
- Large project documents appear to be loaded with scene data, which will increase Firestore read size and initial render cost as projects grow.
- There is no visible optimistic delete rollback or operation status.

### `/app/create`

**Confirmed functional bug:**

- `CreateProjectPage.tsx` line 16 creates `aspectRatio` state.
- The submit payload at lines 25-28 includes only `name` and `description`.
- The selected aspect ratio is therefore discarded.
- The page copy says the user is configuring the canvas, but the request does not carry that configuration.

**Additional gaps:**

- The form uses `alert()` for errors.
- Input validation is limited to a non-empty name on the client; backend validation and limits must be the authoritative contract.
- No idempotency key protects against double submission or network retry creating duplicate projects.
- No explicit initial canvas resolution/FPS/color/audio policy is surfaced.

### `/app/studio`

**Implemented:**

- Workspace-oriented production UI.
- Stage navigation and project context.
- Scene, storyboard, visual context, timeline, media, and export-related surfaces.
- Render status and download API methods.

**Risks/gaps to validate in a later execution phase:**

- Whether all mutations use revision-aware optimistic concurrency.
- Whether rapid scene edits can race and overwrite newer state.
- Whether render requests snapshot project state or read mutable project state throughout the job.
- Whether every scene asset is guaranteed to be available locally before FFmpeg starts.
- Whether the UI handles browser refresh, expired jobs, server restarts, and a download URL that returns an expired local file.
- Whether all stage transitions are keyboard accessible and preserve unsaved state.

## 4. Rendering and downloading review

### Current strengths

- FFmpeg executable discovery has multiple fallbacks.
- Render stages include image preparation, timeline generation, scene clip rendering, concatenation, subtitles, audio mixing, finalization, and output checks.
- Cloud deployments reduce scene-level parallelism with a semaphore, which is safer than unrestricted FFmpeg concurrency.
- Render status includes progress/stage information.
- Retry endpoints exist.
- Render metadata is written to local JSON and attempted in Firestore.
- `+faststart` is used for MP4 finalization.

### Critical reliability problems

#### A. Durable metadata but non-durable output

The render service writes completed `output_path` values relative to `STORAGE_DIR`. The Firestore fallback reconstructs a job but checks the local path and marks the job expired if it is missing. This means:

- A successful render can become unavailable after a restart.
- Horizontal scaling can make a job visible on one instance but not its output bytes.
- The download endpoint cannot provide a stable CDN/object URL for completed exports.
- Retention is tied to an instance filesystem rather than a durable storage lifecycle policy.

#### B. In-process background workers

The service starts `_run_render_worker` with `loop.create_task`, or a daemon thread outside an event loop. This causes:

- Work loss on process termination.
- No durable queue acknowledgement.
- No worker lease or recovery for a worker that dies mid-job.
- Possible duplicate processing after retries or multi-instance races.
- No per-user/project concurrency policy.
- Web request process resource contention.

#### C. Output correctness is not a contract

The pipeline has technical checks, but production correctness requires a versioned export contract:

- immutable project revision and scene ordering;
- exact source asset identities and checksums;
- explicit width, height, FPS, pixel format, color space, audio sample rate, channel layout, codec, bitrate/CRF, and container policy;
- handling for variable-frame-rate audio/video inputs;
- caption timing rounding policy;
- deterministic transition and motion behavior;
- output probe results and SHA-256 checksum;
- durable manifest linking every input and generated intermediate.

#### D. Cost and performance

The service currently creates scene-level MP4s and later concatenates/transcodes. This is robust for isolation but expensive in disk I/O and CPU. A production design should benchmark:

- one-pass versus staged rendering where safe;
- concat demuxer versus filter graph;
- image pre-scaling once versus repeated FFmpeg scaling;
- hardware acceleration availability and fallback;
- per-resolution presets;
- maximum scene count/duration and resource quotas;
- cold-start and queue wait time separately from encode time.

## 5. Backend/API and data-model review

### Strengths

- FastAPI routes generally use authentication dependencies.
- Project reads/writes are owner-aware in the principal routes.
- Firestore rules restrict nested projects to the owner.
- Storage rules constrain content types and sizes for user-owned media.
- Production startup validation rejects missing/insecure encryption configuration and non-Firestore production backends.

### Gaps and concerns

- Project creation does not apply the canvas settings selected by the frontend.
- Render job ownership must be enforced consistently in every lookup; the download route contains fallback lookup paths that should be formally threat-modeled and covered by authorization tests.
- Render jobs are stored in a root `render_jobs` collection path in service code; corresponding Firestore rules/indexes should be explicitly reviewed and added if client visibility or server queries require them.
- No explicit queue/worker service exists in `render.yaml`.
- The current API lacks a clear versioning strategy (`/api` rather than `/api/v1`).
- Rate limiting, request quotas, body-size policies, and per-user concurrency limits are not evident in the deployment manifest.
- Long-running media endpoints need timeout, cancellation, and resumable-upload/download policies.
- API error handling should standardize machine-readable error codes, retryability, correlation IDs, and user-safe messages.
- Firestore document growth must be controlled: scene arrays and project documents should not grow without a defined maximum or subcollection strategy.
- There is no visible migration/version field strategy for project schema evolution in the reviewed paths.

## 6. Security and SaaS operations review

### Positive controls

- Firebase ID-token authentication is present.
- Owner-scoped project access is implemented in the main project APIs.
- API keys are intentionally blocked from direct client Firestore access.
- Production credential encryption is fail-closed.
- Storage rules default-deny unknown paths.
- Basic security headers are configured at Firebase Hosting.

### Production gaps to address

- Add server-side rate limiting and quotas for project creation, uploads, AI generation, TTS, and renders.
- Add abuse controls for remote image URLs and any server-side URL retrieval: scheme allowlist, DNS/private-IP blocking, size/time limits, redirect limits, and content validation.
- Add structured audit logs for auth-sensitive, payment, API-key, export, and destructive operations.
- Ensure admin authorization relies on verified claims/roles, not only email configuration.
- Add secret rotation and key-version metadata for encrypted credentials.
- Define retention/deletion guarantees for source assets, generated assets, renders, logs, and backups.
- Add observability: request IDs, render IDs, user/project IDs (non-sensitive), queue wait, CPU/memory/disk, FFmpeg exit reason, output checksum, and storage upload result.
- Add alerting for failed renders, queue age, storage failures, OOM/restarts, and elevated download errors.

## 7. Phased remediation plan

Each phase should be implemented and verified before starting the next. This document is the plan only; execution requires a separate user command.

### Phase 0 - Baseline and contracts

- Freeze the current API/data contracts and identify all render-related frontend callers.
- Add a reproducible terminal-only baseline:
  - frontend type/build;
  - frontend lint;
  - frontend tests;
  - backend tests;
  - FFmpeg availability/probe checks;
  - static dependency and configuration checks.
- Define measurable SLOs:
  - project list first usable render;
  - upload throughput;
  - render queue wait;
  - render time per output minute;
  - download success rate;
  - exact-output validation rate;
  - maximum supported duration/scenes/asset size.
- Define a versioned render manifest and project schema version.

### Phase 1 - Fix correctness and data flow

- Send the selected aspect ratio from `/app/create` to the API.
- Extend project creation schema/service to persist `canvas_settings` atomically.
- Make the backend authoritative for allowed aspect ratio, resolution, FPS, and defaults.
- Add idempotency keys to project creation and render creation.
- Replace core `alert`/`confirm` flows with controlled, accessible UI states.
- Add mutation error rollback and clear retry states.
- Add tests proving each aspect ratio survives create, reload, studio use, render request, and output probe.

### Phase 2 - Make project and asset storage durable

- Keep project metadata in Firestore with a deliberate document/subcollection model.
- Store every source and generated media object in Cloud Storage with owner/project/job prefixes.
- Upload completed renders before marking a job completed.
- Store object path, signed/CDN URL policy, size, MIME type, checksum, duration, and probe metadata.
- Use Storage lifecycle rules for retention rather than local disk cleanup alone.
- Make local disk a bounded cache/temp workspace only.
- Add resumable uploads and downloads for large media.

### Phase 3 - Introduce a durable render queue

- Separate the API service from the render worker.
- Use a durable queue appropriate to the chosen cloud architecture.
- Add job states, leases, heartbeat, retry count, dead-letter state, cancellation, and idempotent job keys.
- Snapshot the project/render manifest at enqueue time.
- Ensure only one worker owns a job at a time.
- Recover jobs after worker/container failure.
- Enforce per-user and global concurrency limits.

### Phase 4 - Make output deterministic and exact

- Normalize all source images and media with explicit color, dimensions, orientation, and codec rules.
- Define one canonical timeline clock and caption rounding policy.
- Define audio sample rate/channel/volume/ducking policy.
- Define output profiles for 16:9, 9:16, and 1:1, including safe areas.
- Probe every output with FFprobe and reject invalid files.
- Persist an export manifest and SHA-256 checksum.
- Add golden fixtures for scene ordering, captions, transitions, audio duration, aspect ratio, and output metadata.
- Add regression tests that compare manifests and probes; use perceptual image/video comparison only where exact binary equality is not appropriate.

### Phase 5 - Performance and cost optimization

- Instrument queue wait, asset fetch, image normalization, each FFmpeg stage, upload, and download.
- Benchmark representative short, medium, and long projects.
- Cap memory/disk and fail early with actionable messages.
- Reuse normalized assets and avoid repeated work across retries.
- Optimize FFmpeg presets only after correctness fixtures pass.
- Evaluate dedicated CPU/GPU workers and autoscaling.
- Add client-side code splitting for heavy studio modules, query caching, pagination, and virtualized scene lists.
- Use CDN/cache headers for immutable assets while keeping project metadata non-cacheable or correctly revalidated.

### Phase 6 - SaaS hardening

- Add quotas, billing entitlement checks, rate limiting, abuse prevention, and usage accounting at the API boundary.
- Add audit/event trails and operational dashboards.
- Add privacy/export/delete workflows.
- Add backups, restore drills, schema migrations, and disaster recovery objectives.
- Add accessibility and keyboard-flow verification for the studio.
- Add contract tests between frontend and backend.
- Add staging deployment with production-like storage/queue behavior.

### Phase 7 - Release gates

Before production rollout, require:

- all targeted terminal tests and builds pass;
- no unresolved type/lint errors in changed areas;
- render manifest/output probe/checksum is recorded for every completed job;
- restart during queued and processing jobs produces recoverable behavior;
- completed output remains downloadable after worker/API restart;
- unauthorized users cannot read projects, jobs, or downloads;
- quota and cancellation behavior is tested;
- representative performance meets agreed SLOs;
- rollback and data-retention procedures are documented.

## 8. Recommended target architecture

```text
Firebase Hosting
  -> React/Vite application
  -> Firebase Auth ID token

FastAPI API service on Render
  -> Firestore: projects, revisions, manifests, job metadata, usage, billing
  -> Cloud Storage: source media, normalized assets, completed exports
  -> Durable render queue

Dedicated render workers
  -> fetch immutable manifest/assets
  -> render in bounded local scratch space
  -> FFprobe + checksum validation
  -> upload completed export
  -> atomically mark job completed

Observability
  -> structured logs, metrics, traces, alerts, audit events
```

The key invariant should be: **a render is not `completed` until its validated output is durably stored and its manifest/checksum metadata is committed.**

## 9. Files and areas to modify during execution

- `frontend/src/pages/app/CreateProjectPage.tsx` - aspect-ratio request bug and form UX.
- `frontend/src/services/api.ts` - typed API contracts, idempotency, retry/download behavior.
- `frontend/src/types.ts` and related schemas - project/render contract versioning.
- `frontend/src/pages/app/ProjectsListPage.tsx` and studio components - mutation states, pagination, stale/error handling.
- `backend/app/schemas/project.py` - creation/canvas contract.
- `backend/app/services/project_service.py` - atomic persistence and schema/version handling.
- `backend/app/api/routes/projects.py` and `render.py` - authorization, idempotency, errors, cancellation.
- `backend/app/services/render_service.py` - replace in-process lifecycle, manifest/probe/checksum, durable output.
- `backend/app/services/storage/asset_storage.py` - durable render object handling and lifecycle metadata.
- `backend/app/configuration/config.py` - explicit production limits and queue/storage configuration.
- `render.yaml` - separate API and worker deployment configuration, health/readiness, scaling, and secrets.
- `firestore.rules`, `firestore.indexes.json`, and `storage.rules` - job/output access and query/index policy.
- `backend/tests/`, `frontend/tests/` - correctness, authorization, restart, and regression coverage.

## 10. What was not verified in this analysis

- Live behavior of the three deployed URLs.
- Browser rendering, visual layout, accessibility, or download UX.
- Current Render/Firebase runtime logs, instance count, storage objects, or environment secret values.
- Actual production latency, memory, CPU, disk, queue age, or failure rates.
- Full test/build results, because execution was intentionally deferred.

## 11. Execution rule

## 12. Execution log

### Phase 0 - Baseline and contracts: completed

- Confirmed Firestore is **STANDARD / FIRESTORE_NATIVE** for `scenora-46cfe`.
- Corrected terminal validation commands to use `frontend` and the backend virtual environment.
- Frontend production build passed.
- Frontend test suite passed: 33 tests.
- Backend targeted baseline passed: 26 tests.
- Documented existing build warnings for large bundles and Firestore/prerender network noise.

### Phase 1 - Fix correctness and data flow: completed

- Fixed the `/app/create` aspect-ratio data-loss bug.
- Added typed `canvas_settings` to the frontend project-create contract.
- Added backend support for persisting canvas settings at project creation.
- Added aspect-ratio-to-resolution mapping for 16:9, 9:16, and 1:1.
- Added a backend regression test proving create and reload preserve the selected canvas.
- Validation passed:
  - frontend build;
  - frontend tests: 33 passed;
  - backend project/settings tests: 12 passed.

### Phase 2 - Make render outputs durable: completed

- Added render owner and durable-storage metadata.
- Added streaming file-to-Cloud-Storage upload support without loading the complete video into memory.
- Render completion now requires durable upload in production before status becomes `completed`.
- Download requests restore missing local render files from Cloud Storage.
- Persisted durable render paths in local job metadata and Firestore synchronization payloads.
- Added a render model regression test for durable output metadata.
- Validation passed:
  - backend render tests: 2 passed;
  - backend project tests: 16 passed;
  - frontend production build;
  - backend syntax compilation;
  - `git diff --check`.

### Phase 3 - Durable render queue: completed

- Production web instances no longer start in-process FFmpeg workers.
- Added Firestore-backed worker claiming with transaction protection, worker identity, lease expiry, stale-lease recovery, and attempt counts.
- Added a dedicated `backend/app/worker.py` polling process for queued render jobs.
- Added a Render background-worker service to `render.yaml`.
- Production status/list reads refresh from Firestore so web-instance memory cannot hide worker progress.
- Processing, completion, and failure transitions clear ownership leases.
- Added a Firestore composite index for queued render ordering.
- Preserved local in-process rendering for development and tests.
- Validation passed:
  - backend syntax compilation;
  - focused backend render/project tests: 18 passed;
  - `git diff --check`.
- Deployment was not performed. The worker requires the same Firebase service-account and encryption secrets as the web service.

### Phase 4 - Deterministic and validated output: completed

- Added a versioned render manifest snapshot when a job is enqueued.
- Persisted manifest version, manifest data, output SHA-256, and FFmpeg probe metadata with every render job.
- Added streaming SHA-256 calculation so large MP4s are not loaded into memory.
- Added final-output validation for expected dimensions, frame rate, duration tolerance, H.264-compatible video, and YUV 4:2:0 pixel format.
- Exposed output checksum and probe metadata through the render API response.
- Made local/test Cloud Storage upload failures best-effort while preserving strict durable-upload failure behavior in production.
- Added manifest/checksum regression coverage and ran real FFmpeg canvas tests.
- Validation passed:
  - backend syntax compilation;
  - focused deterministic tests: 3 passed;
  - real FFmpeg render tests: 8 passed;
  - `git diff --check`.
- Deployment was not performed and no browser testing was used.

### Phase 5 - Performance and cost optimization: completed

- Changed the authenticated frontend shell to lazy-load dashboard, project list, and Studio routes instead of eagerly downloading the full editor.
- Split admin pages into independent route chunks rather than one 673 KB admin bundle.
- Removed the forced Firebase vendor chunk and lazy-loaded Firestore initialization; Firestore now loads only for Firestore-backed features.
- Reduced repeated render cleanup work by throttling automatic retention scans to once per 30 seconds while preserving explicit cleanup behavior.
- Removed artificial 100 ms render-stage sleeps that added latency without improving correctness.
- Made scene render concurrency configurable with `RENDER_SCENE_CONCURRENCY`, defaulting conservatively to one worker in production.
- Measured production build output:
  - admin route chunks are now approximately 1-15 KB each;
  - project list route is approximately 4.4 KB;
  - Firestore moved to a deferred approximately 437 KB chunk;
  - frontend tests: 33 passed;
  - backend focused render tests: 4 passed;
  - real FFmpeg render tests from Phase 4: 8 passed;
  - backend compilation and `git diff --check` passed.
- Deployment was not performed and no browser testing was used.

### Next execution slice

Phase 6 will harden SaaS operations with quotas, rate limiting, observability, audit trails, retention policy enforcement, and recovery workflows.

Implementation is now authorized by the user, but deployment and browser testing remain intentionally excluded unless separately requested.

### Phase 6 - SaaS abuse protection and quota verification: completed

- Verified that image-generation and storyboard-generation services already reserve and finalize usage quota centrally; route-level reservations were deliberately not duplicated because that would double-charge users.
- Added a bounded, thread-safe sliding-window limiter for expensive render, image-generation, variation, retry, and storyboard-regeneration endpoints.
- Enabled the limiter only in production so local development and deterministic tests are not affected by process-local request history.
- Added `EXPENSIVE_REQUESTS_PER_MINUTE` configuration with a conservative default of 20 requests per minute.
- Added HTTP 429 responses with a stable `RATE_LIMITED` error code and `Retry-After` header.
- Added bounded key eviction to prevent untrusted clients from growing limiter memory without limit.
- Added focused limiter regression tests.
- Validation passed:
  - quota and render regression tests: 26 passed;
  - backend Python compilation;
  - focused limiter tests;
  - `git diff --check`.
- The limiter is intentionally per service instance. A later infrastructure slice should move the bucket state to a shared atomic store (for example Redis or Firestore) before horizontal scaling if strict global limits are required.

### Phase 6.1 - Request tracing and destructive-action auditability: completed

- Added a request-scoped correlation ID for every API request.
- Accepts a safe caller-supplied `X-Request-ID` or generates a cryptographically random identifier.
- Returns the identifier in the response `X-Request-ID` header.
- Includes the identifier in application log records without exposing authorization headers or query credentials.
- Added an audit event when an authenticated user deletes a render job, including only project and job identifiers.
- Preserved the existing audit repository's secret-redaction behavior.
- Validation passed:
  - backend compilation;
  - focused render and rate-limit tests;
  - `git diff --check`.

### Phase 7 - Render observability and recovery diagnostics: completed

- Added persisted render lifecycle metrics:
  - queue wait time;
  - total render duration;
  - durable upload duration;
  - scene count;
  - output byte size.
- Exposed those metrics through the render status API.
- Added stable failure categories:
  - `ffmpeg_failed`;
  - `output_validation_failed`;
  - `durable_storage_failed`;
  - `project_missing`;
  - `render_failed`.
- Added structured render completion/failure log messages containing operational metrics without source content or credentials.
- Preserved existing lease, retry, durable upload, checksum, and output-validation behavior.
- Added focused regression tests for metric fields and failure classification.
- Validation passed:
  - backend compilation;
  - focused render metrics, render, and rate-limit tests;
  - `git diff --check`.
- Further work remains for a shared metrics backend and worker heartbeat dashboard; this slice makes the required signals available first.

### Phase 8 - Shared worker health and queue diagnostics: completed

- Added render-worker heartbeats stored in Firestore under `render_workers/{worker_id}`.
- Added local in-memory fallback for development and tests.
- Workers now report polling, processing, and idle states, including the current render job when applicable.
- Added stale-worker detection based on configurable diagnostic age.
- Added queue diagnostics for queued and processing render jobs.
- Included worker and queue diagnostics in detailed health responses without exposing credentials or filesystem paths.
- Heartbeat failures are intentionally non-fatal and never stop a render worker.
- Added focused tests for healthy and stale workers.
- Validation passed:
  - backend compilation;
  - focused worker-health, render, and rate-limit tests;
  - `git diff --check`.

### Phase 9 - Retention, deletion, and recovery correctness: completed

- Durable render deletion now removes the corresponding Cloud Storage object when ownership metadata is available.
- Local transcode caches and render files continue to be removed during deletion.
- Queued and processing render jobs are protected from deletion and return a conflict instead of being silently removed.
- Retention cleanup continues to target only expired completed jobs.
- Cloud deletion failures are logged and do not leave the local job index in an inconsistent state.
- Added regression tests for active-job protection and completed-only retention cleanup.
- Validation passed:
  - backend compilation;
  - focused retention, worker-health, render, and rate-limit tests;
  - `git diff --check`.

### Phase 10 - Security and access-control hardening: completed

- Restricted Firestore user-document reads to the owning authenticated user.
- Restricted `platform/config` reads and writes to Firebase admin claims.
- Removed query-string authentication from backend dependencies.
- Made local fallback authentication explicit through `LOCAL_DEV_FALLBACK_ENABLED`; Render/production environments default it to disabled.
- Prevented unassigned filesystem projects from being silently claimed by arbitrary authenticated users.
- Added owner/admin authorization to the media restoration and signed-URL fallback route.
- Disabled fallback-user render downloads in production; local fallback remains development-only for existing offline workflows.
- Preserved strict owner checks for authenticated render downloads.
- Updated security regression expectations for the intentional authorization changes.
- Validation passed:
  - frontend tests: 33 passed;
  - backend security-focused tests: 22 passed;
  - backend compilation;
  - `git diff --check`.
- Firestore and Storage rules still require deployment separately; no live Firebase rules deployment was performed.

### Phase 11 - Multi-instance SaaS operational readiness: completed

- Added a Firestore-backed shared sliding-window rate limiter for production Render instances.
- Rate-limit bucket IDs are SHA-256 hashes, so authorization headers and client identifiers are never stored in Firestore.
- Firestore reservations use transactions to prevent concurrent instances from exceeding the configured limit.
- Added `RATE_LIMIT_STORAGE_BACKEND` configuration:
  - `firestore` in Render deployments by default;
  - `memory` in local development by default.
- Preserved the bounded in-memory fallback when Firestore is unavailable.
- Retained the existing `Retry-After` response contract and `RATE_LIMITED` error code.
- Replaced raw authorization suffixes in rate-limit keys with hashed identifiers.
- Added no new deployment side effects; the Firestore collection is created lazily on first production request.
- Validation passed:
  - backend compilation;
  - focused rate-limit, worker-health, render, and security tests;
  - `git diff --check`.

### Phase 12 - Final release-readiness validation: completed

- Completed terminal-only regression validation without browser testing or deployment.
- Backend:
  - full pytest suite: **292 passed**;
  - Python compilation passed;
  - only dependency/runtime deprecation warnings remained.
- Frontend:
  - full Node test suite: **33 passed**;
  - TypeScript production build and Vite bundle completed successfully;
  - oxlint completed successfully with existing React hook/Fast Refresh warnings.
- Deployment configuration review:
  - Firebase Hosting rewrites, immutable asset caching, security headers, Firestore rules/index references, and Storage rules references are configured.
  - Render web and worker services are configured separately.
  - Production rate limiting is now explicit in `render.yaml` with Firestore storage and a 20-request/minute expensive-operation limit.
- Firestore index review includes project ownership ordering, payment/admin queries, and render queue ordering.
- Corrected the Firestore rules comment to document that platform configuration is admin-only and public pricing uses `/api/plans`.
- `git diff --check` passed.
- No Firebase rules/index deployment, Render deployment, or live provider validation was performed.

#### Remaining live-release checklist

1. Deploy and verify Firestore rules/indexes and Storage rules in the intended Firebase project.
2. Confirm Render secrets, Firebase service-account credentials, encryption key, provider keys, and worker/web environment parity.
3. Run authenticated staging smoke tests for project ownership, media access, render queue processing, durable download, deletion, quotas, and rate limiting.
4. Verify FFmpeg and provider behavior with representative real media and long-running multi-scene renders.
5. Configure production alerting for worker heartbeat staleness, queue growth, render failure categories, provider failures, and quota/payment inconsistencies.

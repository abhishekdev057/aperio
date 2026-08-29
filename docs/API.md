# Aperio API

All endpoints are under `/api/v1`. Protected endpoints require the Aperio session cookie. Every response is wrapped as:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Authentication

- `POST /auth/register` — `{ fullName, email, password }` creates a user, profile, preference row, and session.
- `POST /auth/login` — `{ email, password }` starts a session.
- `POST /auth/logout` — clears the current session.
- `GET /auth/google` — sets a short-lived state cookie and redirects to Google's consent screen. Returns a redirect to `/login?error=google_unavailable` when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset.
- `GET /auth/google/callback` — Google returns here with `code` and `state`. Validates state, exchanges the code with the client secret, reads the verified profile, links by `google_id` or verified email or creates a new user, starts a session, and redirects to `/onboarding` (new) or `/overview`. Failures redirect to `/login?error=...`.

## Profile and reference data

- `GET /me` — current user and profile.
- `PATCH /me` — validated profile updates.
- `GET /roles` — active role catalog with the current user's latest match when available.
- `GET /roles/:id` — role plus level-specific requirements.
- `GET /skills` — skill catalog.
- `GET /profile/skills` — current user's inferred or corrected skills.
- `PATCH /profile/skills/:id` — `{ level, userVerified }` saves a user correction.

## Resumes and analysis

- `GET /resumes` — owned resume metadata and verification status; extracted text is never returned.
- `POST /resumes` — multipart field `file`; accepts PDF, DOCX, JPG, PNG, or WebP up to 5 MB. The route validates magic bytes, uses Gemini OCR/vision to reject non-resume documents, extracts structured evidence, and stores private metadata/text. A rejected document returns `NOT_A_RESUME`.
- `GET /analyses?limit=20&offset=0` — append-only history.
- `POST /analyses` — `{ roleId, experienceLevel, resumeId? }`; compares real profile/resume evidence and creates an analysis plus roadmap.
- `GET /analyses/:id` — owned report with evidence and skill results.
- `GET /history` — history alias.
- `GET /role-comparison?left=:analysisId&right=:analysisId` — compares two owned analyses.
- `GET /market?roleId=:id&level=junior|mid|senior&region=global` — returns `{ leverage, outlook }`. `leverage` is computed from the seeded catalog (per-skill `roleCount`, `criticalCount`, `leverageIndex` 0–100). `outlook` is `{ connected: false, ... }` until a job-postings source is ingested; when connected it returns latest `signals` and linear `projections` built only from real dated observations. Never returns fabricated demand numbers.

## Roadmaps

- `GET /roadmaps?analysisId=:id` — latest owned roadmap or roadmap for a specific owned analysis.
- `PATCH /roadmaps/items/:id` — `{ status: "not_started" | "in_progress" | "completed" }`; updates only an item owned through the user's roadmap.

## Errors and security

Zod validates all request bodies, route IDs, enum values, pagination, and uploads. The API does not return SQL errors or private resume text. Analysis creation is throttled per user for a short interval to prevent accidental duplicate runs.

Gemini credentials are read only in server modules from `GEMINI_API_KEY` (or the local compatibility alias `GEMINI_KEY`). They are never returned by the API or bundled into browser code. Uploaded document content is treated as untrusted input so text inside a resume cannot override the extraction instructions.

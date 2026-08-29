# Aperio

Aperio is an evidence-based AI skill-gap analyzer for career roles. It compares a user's resume and profile with role-specific requirements, explains the evidence behind each result, and generates a prioritized learning roadmap.

## Stack

- Next.js 16 App Router, React, TypeScript
- Tailwind CSS 4 and small shadcn-style primitives
- Neon PostgreSQL through `@neondatabase/serverless`
- Zod validation, secure HTTP-only sessions, bcrypt password hashing
- Gemini multimodal resume verification, OCR, evidence extraction, and personalized guidance
- Local PDF/DOCX extraction fallback with `unpdf` and `mammoth`

## Local setup

1. Install Node.js 20.9+ and npm.
2. Copy `.env.example` to `.env.local`; set `DATABASE_URL` to a Neon connection string and `GEMINI_API_KEY` to a server-side Gemini API key. `GEMINI_KEY` is also accepted locally as a compatibility alias. For Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see Authentication below).
3. Install dependencies with `npm install`.
4. Create tables and seed the role/skill reference catalog:

   `npm run db:setup`

5. Start the app:

   `npm run dev`

Open `http://localhost:3000`.

## Data and analysis architecture

Role and skill reference data lives in `roles`, `skills`, and `role_skill_requirements`. User-owned records live in profiles, resumes, analyses, analysis skill results, roadmaps, and roadmap items. Analysis is append-only: every run creates a separate report and roadmap.

Resume uploads are validated for size, MIME type, and file signature before Gemini sees them. Gemini then uses document vision/OCR to verify that the upload is genuinely a resume or CV, read scanned and image-based layouts, and extract structured evidence. Only sanitized metadata, structured parsing results, and extracted text are stored; raw files are not exposed through a public URL.

The career match remains deterministic: Aperio searches actual profile/resume evidence, compares it with stored role requirements, assigns transparent levels, and calculates a weighted score. Gemini cannot change the score or classifications; it converts those grounded results into a concise summary and personalized project-oriented roadmap. If career diagnostics are temporarily unavailable, deterministic guidance is used instead.

## Authentication

Aperio uses email/password authentication with bcrypt-hashed passwords and random, SHA-256-hashed session tokens in an HTTP-only cookie. Route handlers call `requireUser()` and every user-owned query includes the authenticated user ID for ownership checks.

### Google sign-in

Optional and additive; email/password keeps working when it is not configured.

1. In Google Cloud Console create an OAuth 2.0 **Web application** client.
2. Authorized JavaScript origins: `https://<your-domain>` and `http://localhost:3000`.
3. Authorized redirect URIs: `https://<your-domain>/api/v1/auth/google/callback` and `http://localhost:3000/api/v1/auth/google/callback`.
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and (in production) `APP_ORIGIN` to the public origin with no trailing slash so the redirect URI is built to match the registered one.

The flow is a server-side authorization-code exchange: `GET /api/v1/auth/google` sets a signed state cookie and redirects to Google; `GET /api/v1/auth/google/callback` verifies the state, exchanges the code for tokens over TLS with the client secret, reads the verified profile from Google's userinfo endpoint, then links by `google_id`, links an existing account by verified email, or creates a new user. The client secret is server-only and never sent to the browser. Migration `003_google_oauth.sql` makes `users.password_hash` nullable and adds `google_id`, `avatar_url`, and `auth_provider`.

## API

See [docs/API.md](docs/API.md) for the mobile-ready `/api/v1` contract.

See [docs/ANALYSIS_ARCHITECTURE.md](docs/ANALYSIS_ARCHITECTURE.md) for the deterministic/AI boundary and the implementation review of the supplied algorithm suite.

## Validation and production checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The app is Vercel-compatible: set `DATABASE_URL`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_ORIGIN` as encrypted Vercel environment variables, optionally set `GEMINI_MODEL` (the recommended stable default is `gemini-2.5-flash`), and deploy the repository. Aperio automatically retries supported stable Flash models when a configured model is unavailable or rejects the request. No credentials are committed. Never prefix these secrets with `NEXT_PUBLIC_`.

## AI handoff

Read [AI_COORDINATION.md](AI_COORDINATION.md) before resuming work from another agent. Run `npm run ai:handoff` before a limit-driven handoff; it writes a local `.ai/HANDOFF.md` snapshot for the next Codex or Claude session.

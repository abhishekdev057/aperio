/**
 * Live job-postings ingestion for the market outlook signal.
 *
 * This script intentionally does NOT ship synthetic demand numbers. Aperio's
 * no-fake-data rule (AI_COORDINATION.md, docs/ANALYSIS_ARCHITECTURE.md) means the
 * `market_signals` table stays empty until a real, timestamped job-postings
 * source is wired in here.
 *
 * To enable it:
 *  1. Pick a job-postings data source (an ATS/jobs API, a licensed dataset, or
 *     your own crawler output). On Vercel, discover one through the Marketplace.
 *  2. Implement `fetchObservations()` below to return one row per
 *     (skill, region) for the current capture, mapping the source's taxonomy to
 *     Aperio skill ids (`skill-<slug>`).
 *  3. Schedule this script (e.g. a Vercel cron) so each run appends a new dated
 *     observation. Two or more observations per skill unlock the forecast in
 *     lib/market.ts.
 *
 * Run: tsx scripts/ingest-market.ts
 */
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const sql = neon(url);

interface Observation {
  skillId: string; // must match an existing skills.id, e.g. "skill-react"
  region: string; // e.g. "global", "in", "us"
  demandIndex: number; // 0-100, normalised share of postings mentioning the skill
  postingCount: number; // absolute count in this capture window
  trend: "rising" | "steady" | "declining" | "unknown";
  yoyChange: number | null; // percent change vs a year ago, if the source provides it
  horizonDays: number; // window the capture covers, e.g. 30
  source: string; // provenance string, e.g. "acme-jobs-api@2026-08"
}

function fetchObservations(): Promise<Observation[]> {
  // TODO: replace with a real job-postings source. Returning [] keeps the table
  // truthful (market outlook reports "not connected") rather than fabricated.
  return Promise.resolve([]);
}

async function main() {
  const observations = await fetchObservations();
  if (!observations.length) {
    console.log(
      "No job-postings source configured. `market_signals` left untouched.\n" +
        "Implement fetchObservations() in scripts/ingest-market.ts to enable the market outlook.",
    );
    return;
  }

  const skillIds = new Set((await sql.query("SELECT id FROM skills")).map((row: Record<string, unknown>) => row.id as string));
  let inserted = 0;
  for (const o of observations) {
    if (!skillIds.has(o.skillId)) {
      console.warn(`Skipping unknown skill id: ${o.skillId}`);
      continue;
    }
    await sql.query(
      `INSERT INTO market_signals (id, skill_id, region, demand_index, posting_count, trend, yoy_change, horizon_days, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), o.skillId, o.region, o.demandIndex, o.postingCount, o.trend, o.yoyChange, o.horizonDays, o.source],
    );
    inserted += 1;
  }
  console.log(`Ingested ${inserted} market observations.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

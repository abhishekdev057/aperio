/**
 * Market signal ingestion.
 *
 * For every enabled row in `market_sources`, pull real job postings and count how
 * often each catalog skill is mentioned, then store one dated observation per
 * skill (weighted later by the source's weight in lib/market.ts). No fabricated
 * numbers — a source with no reachable data simply writes nothing.
 *
 * Implemented source: Arbeitnow (free public job board, no key). Link a source in
 * Admin → Job market with integration key `jobs.arbeitnow`.
 *
 * Run: tsx scripts/ingest-market.ts   (schedule it so 2+ captures accumulate)
 */
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const sql = neon(url);

function escapeRegExp(v: string) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface ArbeitnowJob {
  title?: string;
  description?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  remote?: boolean;
}

async function fetchArbeitnow(pages: number, remoteOnly: boolean): Promise<string[]> {
  const haystacks: string[] = [];
  for (let page = 1; page <= pages; page += 1) {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) break;
    const json = (await res.json()) as { data?: ArbeitnowJob[] };
    const jobs = json.data ?? [];
    if (!jobs.length) break;
    for (const job of jobs) {
      if (remoteOnly && !job.remote) continue;
      const text = [job.title, (job.tags ?? []).join(" "), (job.job_types ?? []).join(" "), job.location, job.description ?? ""]
        .filter(Boolean)
        .join(" ")
        .replace(/<[^>]+>/g, " ")
        .toLowerCase();
      haystacks.push(text);
    }
  }
  return haystacks;
}

async function main() {
  const sources = (await sql.query(
    "SELECT id, name, integration_key, config, region FROM market_sources WHERE enabled = true",
  )) as Array<{ id: string; name: string; integration_key: string | null; config: Record<string, unknown>; region: string }>;

  if (!sources.length) {
    console.log("No enabled market_sources. Add one in Admin → Job market.");
    return;
  }

  const skills = (await sql.query("SELECT id, name, aliases FROM skills")) as Array<{ id: string; name: string; aliases: string[] }>;
  const matchers = skills.map((s) => ({
    id: s.id,
    patterns: [s.name, ...(s.aliases ?? [])]
      .filter((a) => a && a.length > 2)
      .map((a) => new RegExp(`(^|[^a-z0-9+])${escapeRegExp(a.toLowerCase())}([^a-z0-9+]|$)`)),
  }));

  let totalInserted = 0;
  for (const source of sources) {
    if (source.integration_key !== "jobs.arbeitnow") {
      console.log(`Skipping "${source.name}" — no ingester for integration key ${source.integration_key ?? "(none)"}.`);
      continue;
    }
    const pages = Math.max(1, Math.min(20, Number(source.config?.pages ?? 5)));
    const remoteOnly = String(source.config?.remoteOnly ?? "").toLowerCase() === "true";
    const haystacks = await fetchArbeitnow(pages, remoteOnly);
    if (!haystacks.length) {
      console.log(`"${source.name}" returned no postings.`);
      continue;
    }

    const counts = new Map<string, number>();
    for (const text of haystacks) {
      for (const m of matchers) {
        if (m.patterns.some((p) => p.test(text))) counts.set(m.id, (counts.get(m.id) ?? 0) + 1);
      }
    }

    const total = haystacks.length;
    for (const [skillId, count] of counts) {
      if (!count) continue;
      const demandIndex = Math.round(Math.min(100, (count / total) * 100));
      await sql.query(
        `INSERT INTO market_signals (id, skill_id, region, demand_index, posting_count, trend, horizon_days, source, source_id)
         VALUES ($1,$2,$3,$4,$5,'unknown',30,$6,$7)`,
        [randomUUID(), skillId, source.region, demandIndex, count, source.name, source.id],
      );
      totalInserted += 1;
    }
    console.log(`"${source.name}": scanned ${total} postings, wrote ${counts.size} skill observations.`);
  }

  console.log(`Done. ${totalInserted} observations inserted.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

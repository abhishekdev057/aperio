import Link from "next/link";
import { ArrowRight, Map, Sparkles } from "lucide-react";
import { RoadmapView } from "@/components/roadmap-view";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";
import { getRoadmap } from "@/lib/reports";

export const metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const user = await requirePageUser();
  const roadmap = await getRoadmap(user.id);
  const roadmapRecord = roadmap as (Record<string, unknown> & { items: Record<string, unknown>[] }) | null;
  return <div className="aperio-page"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="aperio-eyebrow flex items-center gap-2"><Sparkles size={12} />What to do next</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-[38px]">{roadmapRecord ? String(roadmapRecord.title) : "Your learning roadmap"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">A focused sequence built from your current evidence and the role gaps that matter most.</p></div>{roadmap && <Button asChild variant="secondary"><Link href="/analyze">Re-analyze later <ArrowRight size={15} /></Link></Button>}</header><div className="mt-7">{roadmapRecord && Array.isArray(roadmapRecord.items) && roadmapRecord.items.length ? <RoadmapView initialItems={roadmapRecord.items as never[]} /> : <div className="aperio-panel px-6 py-16 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]"><Map size={21} /></span><h2 className="mt-5 text-lg font-semibold">No roadmap yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Run an analysis to generate a roadmap from the specific gaps in your profile.</p><Button asChild className="mt-6"><Link href="/analyze">Run analysis <ArrowRight size={15} /></Link></Button></div>}</div></div>;
}

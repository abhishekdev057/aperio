import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  return <div className={cn("relative grid shrink-0 place-items-center rounded-full", size === "lg" ? "size-36 sm:size-44" : "size-16", "bg-[conic-gradient(var(--primary)_calc(var(--score)*1%),var(--surface-muted)_0)]")} style={{ "--score": score } as React.CSSProperties} aria-label={`${score}% match`} role="img">
    <div className={cn("grid place-items-center rounded-full bg-[var(--surface)]", size === "lg" ? "size-[calc(100%-12px)]" : "size-[calc(100%-7px)]")}>
      {size === "lg" ? <div className="text-center"><div className="text-4xl font-semibold tracking-[-.055em]">{score}%</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Match</div></div> : <span className="text-sm font-bold">{score}</span>}
    </div>
  </div>;
}

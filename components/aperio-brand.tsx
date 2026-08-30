import Link from "next/link";
import { cn } from "@/lib/utils";

export function AperioBrand({ subtitle = true, className, href = "/", inverse = false }: { subtitle?: boolean; className?: string; href?: string; inverse?: boolean }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)} aria-label="Aperio home">
      <span className="relative grid size-9 shrink-0 place-items-center" aria-hidden="true">
        <span className="absolute left-[8px] top-[4px] h-8 w-[7px] rotate-[28deg] rounded-sm bg-gradient-to-b from-[#8478ff] to-[#4338ca]" />
        <span className="absolute right-[8px] top-[4px] h-8 w-[7px] -rotate-[28deg] rounded-sm bg-gradient-to-b from-[#6157f0] to-[#3127c8]" />
        <span className={cn("absolute bottom-[8px] h-[6px] w-[14px] rounded-full transition-colors", inverse ? "bg-[#07121f]" : "bg-[var(--surface)]")} />
      </span>
      <span className="min-w-0"><span className={cn("block text-[17px] font-bold tracking-[.115em]", inverse && "text-white")}>APERIO</span>{subtitle && <span className={cn("mt-0.5 block text-[10px] font-medium", inverse ? "text-slate-500" : "text-[var(--muted)]")}>Career Intelligence</span>}</span>
    </Link>
  );
}

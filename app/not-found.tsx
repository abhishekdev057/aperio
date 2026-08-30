import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { AperioBrand } from "@/components/aperio-brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="aperio-panel w-full max-w-xl px-6 py-14 text-center"><div className="flex justify-center"><AperioBrand /></div><span className="mx-auto mt-9 grid size-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]"><Compass size={21} /></span><p className="mt-5 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">404 · Path not found</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.035em]">This career path is not available</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">The page may have moved, or the report may no longer be accessible from this account.</p><Button asChild className="mt-6"><Link href="/overview"><ArrowLeft size={15} />Return to overview</Link></Button></section></main>;
}

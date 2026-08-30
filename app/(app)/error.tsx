"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="aperio-page"><section className="aperio-panel mx-auto max-w-2xl px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--critical-soft)] text-[var(--critical)]"><TriangleAlert size={21} /></span><h1 className="mt-5 text-2xl font-semibold tracking-[-.035em]">This workspace could not load</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">The request may have been interrupted or a service may be temporarily unavailable. Your saved data has not been changed.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={retry}><RotateCcw size={15} />Try again</Button><Button asChild variant="secondary"><Link href="/overview">Return to overview <ArrowRight size={14} /></Link></Button></div>{error.digest && <p className="mt-5 text-[10px] text-[var(--muted)]">Reference {error.digest}</p>}</section></div>;
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="aperio-panel mx-auto max-w-xl px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--critical-soft)] text-[var(--critical)]"><ShieldAlert size={21} /></span><h1 className="mt-5 text-2xl font-semibold tracking-[-.035em]">Admin data could not load</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">No administrative action was applied. Retry the request or return to the user workspace.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={retry}><RotateCcw size={15} />Retry</Button><Button asChild variant="secondary"><Link href="/overview"><ArrowLeft size={14} />User app</Link></Button></div>{error.digest && <p className="mt-5 text-[10px] text-[var(--muted)]">Reference {error.digest}</p>}</section>;
}

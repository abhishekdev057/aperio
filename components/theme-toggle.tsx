"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return <button onClick={() => setTheme(dark ? "light" : "dark")} className={cn("flex h-9 items-center justify-center gap-2.5 rounded-[9px] border bg-[var(--surface)] px-2.5 text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]", showLabel && "w-full justify-start px-3", className)} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>
    {dark ? <Sun size={16} /> : <Moon size={16} />}
    {showLabel && <span className="text-xs font-medium">{dark ? "Light mode" : "Dark mode"}</span>}
    {showLabel && <span className="ml-auto h-4 w-7 rounded-full bg-[var(--primary-soft)] p-0.5"><span className={cn("block size-3 rounded-full bg-[var(--primary)] transition-transform", dark && "translate-x-3")} /></span>}
  </button>;
}

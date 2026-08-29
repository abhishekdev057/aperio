"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  return <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="grid size-9 place-items-center rounded-[9px] border bg-[var(--surface)] text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]" aria-label="Toggle color theme">
    {mounted && resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
  </button>;
}

export default function AdminLoading() {
  return <div aria-label="Loading admin page"><div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-muted)]" /><div className="mt-4 h-10 w-64 animate-pulse rounded-[10px] bg-[var(--surface-muted)]" /><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[16px] bg-[var(--surface-muted)]" style={{ animationDelay: `${item * 80}ms` }} />)}</div><div className="mt-5 h-72 animate-pulse rounded-[18px] border bg-[var(--surface)]" /></div>;
}

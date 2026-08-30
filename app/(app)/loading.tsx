export default function ProductLoading() {
  return <div className="aperio-page" aria-label="Loading page">
    <div className="max-w-2xl animate-pulse"><div className="h-3 w-32 rounded bg-[var(--surface-muted)]" /><div className="mt-4 h-10 w-72 max-w-full rounded-[10px] bg-[var(--surface-muted)]" /><div className="mt-3 h-4 w-[34rem] max-w-full rounded bg-[var(--surface-muted)]" /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="h-72 animate-pulse rounded-[22px] bg-[var(--surface-muted)]" /><div className="h-72 animate-pulse rounded-[22px] bg-[var(--surface-muted)] [animation-delay:120ms]" /></div>
    <div className="mt-5 grid gap-5 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-[18px] border bg-[var(--surface)]" style={{ animationDelay: `${item * 90}ms` }} />)}</div>
  </div>;
}

import { AperioBrand } from "@/components/aperio-brand";

// ScreenPal-hosted walkthrough (served from go.screenpal.com's CDN). Override
// with any embeddable player URL via NEXT_PUBLIC_AUTH_VIDEO_EMBED_URL.
const EMBED_URL =
  process.env.NEXT_PUBLIC_AUTH_VIDEO_EMBED_URL ||
  "https://go.screenpal.com/player/cOjUlenwlIa?controls=1&ff=true&share=1&download=1&embed=1&cl=1&width=1280&height=720&overlays=1&ff=1&autoplay=1";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col bg-[var(--surface)] px-6 py-6 sm:px-10 lg:px-16">
        <AperioBrand />
        <div className="my-auto mx-auto w-full max-w-[420px] py-16">{children}</div>
        <p className="text-center text-xs text-[var(--muted)]">Guidance based on the profile evidence you provide.</p>
      </section>

      <section className="relative hidden overflow-hidden border-l bg-[#080e17] lg:block">
        <iframe
          title="Aperio product walkthrough"
          src={EMBED_URL}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; fullscreen *"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#080e17] via-[#080e17]/70 to-transparent px-8 pb-12 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#c2c7d6]">Career readiness intelligence</p>
          <p className="mt-1.5 text-sm font-medium text-[#e7e9f0] [text-shadow:0_1px_16px_rgba(0,0,0,.5)]">See how Aperio turns evidence into a plan.</p>
        </div>
      </section>
    </main>
  );
}

import { AperioBrand } from "@/components/aperio-brand";

const AUTH_VIDEO_URL = process.env.NEXT_PUBLIC_AUTH_VIDEO_URL || "/auth-bg.mp4";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col bg-[var(--surface)] px-6 py-6 sm:px-10 lg:px-16">
        <AperioBrand />
        <div className="my-auto mx-auto w-full max-w-[420px] py-16">{children}</div>
        <p className="text-center text-xs text-[var(--muted)]">Guidance based on the profile evidence you provide.</p>
      </section>

      <section className="relative hidden overflow-hidden border-l bg-[#080e17] p-14 text-white lg:flex lg:flex-col lg:justify-end">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          src={AUTH_VIDEO_URL}
        />
        {/* legibility scrims + brand tint, also the graceful fallback when no video loads */}
        <div className="absolute inset-0 bg-[#080e17]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080e17] via-[#080e17]/75 to-[#080e17]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(79,70,229,.34),transparent_34%),radial-gradient(circle_at_8%_92%,rgba(16,185,129,.12),transparent_32%)]" />
        <div className="absolute inset-0 opacity-[.14] [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#c2c7d6]">Career readiness intelligence</p>
          <blockquote className="mt-5 text-4xl font-medium leading-[1.18] tracking-[-.04em] [text-shadow:0_2px_24px_rgba(0,0,0,.45)]">
            &ldquo;Understand the evidence. Close the right gap. Reach the role.&rdquo;
          </blockquote>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#b8bdcc] [text-shadow:0_1px_16px_rgba(0,0,0,.45)]">
            Aperio translates your real experience into a transparent role analysis and a practical next-step roadmap.
          </p>
        </div>
      </section>
    </main>
  );
}

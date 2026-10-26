import type { ReactNode } from "react";
import { Illustration } from "@/components/ui/illustration";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/marketing/reveal";

function StoreLink({
  href,
  icon,
  top,
  bottom,
}: {
  href: string;
  icon: ReactNode;
  top: string;
  bottom: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 min-w-[10.5rem] items-center gap-3 rounded-[14px] border border-white/20 bg-white/10 px-4 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
      aria-label={`${bottom} — opens in a new tab`}
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/65">{top}</span>
        <span className="block text-sm font-bold">{bottom}</span>
      </span>
    </a>
  );
}

function StoreComingSoon({
  icon,
  store,
}: {
  icon: ReactNode;
  store: "Google Play" | "App Store";
}) {
  return (
    <div
      className="inline-flex h-12 min-w-[10.5rem] cursor-default items-center gap-3 rounded-[14px] border border-white/15 bg-white/5 px-4 text-white/90"
      aria-label={`${store} — coming soon`}
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/50">{store}</span>
        <span className="block text-sm font-bold text-white/95">Coming soon</span>
      </span>
    </div>
  );
}

const playIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="opacity-80" aria-hidden>
    <path d="M3 20.5v-17c0-.6.32-1.15.83-1.44L14.5 12 3.83 21.94A1.68 1.68 0 0 1 3 20.5Zm12.4-7.66 2.85-2.85 3.35 1.9c.9.5.9 1.76 0 2.26l-3.35 1.9-2.85-2.85ZM4.5 2.3 15.6 10.9l-2.7 2.7-9.8-9.8c.3-.7.9-1.24 1.4-1.5Zm11.1 12.8 2.7 2.7-11.1 6.9c-.5-.2-1-.7-1.3-1.3l9.7-8.3Z" />
  </svg>
);

const appleIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="opacity-80" aria-hidden>
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.94.11 1.86-.6 3.24-.68 1.65-.1 2.9.65 3.73 1.96-3.4 2.04-2.85 6.53.52 7.94-.6 1.36-1.38 2.72-2.57 3.95ZM12.03 7.25c-.17-2.02 1.5-3.83 3.4-4-.24 2.1-2.13 3.9-3.4 4Z" />
  </svg>
);

export function DownloadCta() {
  const live = SITE.isPlayStoreLive || SITE.isAppStoreLive;
  return (
    <section id="download" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
      <Reveal className="relative overflow-hidden rounded-[28px] bg-[#064e3b] px-6 py-14 text-white shadow-[var(--shadow-pop)] sm:px-12 md:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 80% at 85% 10%, rgba(0,223,129,0.35), transparent 70%), radial-gradient(40% 60% at 0% 100%, rgba(16,185,129,0.25), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex h-8 items-center rounded-full bg-white/10 px-3 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#a7f3d0]">
              {live ? "Available now" : "Mobile app · coming soon"}
            </span>
            <h2 className="mt-4 text-[clamp(1.9rem,3.8vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.035em]">
              {live ? "Take TrackKaro with you" : "Start on the web today"}
            </h2>
            <p className="mt-3 max-w-lg text-[17px] leading-relaxed text-white/80">
              {live
                ? "Expenses, khata, groups, bills and deals — in English, Hindi or Gujarati, on your phone and the web."
                : "The full TrackKaro dashboard works in your browser now. The Android and iOS apps are getting their finishing touches."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-white px-6 text-[16px] font-bold text-[#064e3b] shadow-xs transition hover:-translate-y-0.5"
              >
                Create free account
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              {SITE.isPlayStoreLive ? (
                <StoreLink href={SITE.playStoreUrl} icon={playIcon} top="Get it on" bottom="Google Play" />
              ) : (
                <StoreComingSoon icon={playIcon} store="Google Play" />
              )}
              {SITE.isAppStoreLive ? (
                <StoreLink href={SITE.appStoreUrl} icon={appleIcon} top="Download on the" bottom="App Store" />
              ) : (
                <StoreComingSoon icon={appleIcon} store="App Store" />
              )}
            </div>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-white/85 transition hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Follow {SITE.instagramHandle} for launch news
            </a>
          </div>
          <div className="hidden justify-center lg:flex">
            <Illustration name="team-celebrating" height={210} color="rgba(255,255,255,0.92)" />
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}

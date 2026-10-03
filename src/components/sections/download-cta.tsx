import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

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
      className="inline-flex h-[3.25rem] min-w-[11rem] items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
      aria-label={`${bottom} — opens in a new tab`}
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-white/65">{top}</span>
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
      className="inline-flex h-[3.25rem] min-w-[11rem] cursor-default items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 text-white/90"
      aria-label={`${store} — coming soon`}
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-wide text-white/50">{store}</span>
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
  return (
    <section id="download" className="scroll-mt-24 px-5 pb-24 pt-4 md:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-primary-strong/30 bg-primary-strong px-6 py-14 text-center text-white sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,223,129,0.35), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-soft">Launch</p>
          <h2 className="mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-extrabold tracking-tight">
            {SITE.isPlayStoreLive || SITE.isAppStoreLive ? "Get TrackKaro" : "Coming soon to your phone"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/80">
            {SITE.isPlayStoreLive || SITE.isAppStoreLive
              ? "Expenses, khata, groups, and deals — in Hindi, English, or Gujarati."
              : "We’re putting the finishing touches on Android and iOS. Google Play and the App Store listings aren’t live yet."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

          <p className="mt-6 text-sm font-medium text-white/75">
            Follow us for launch updates and early access news.
          </p>

          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-300" aria-hidden>
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            Instagram {SITE.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

function StoreBadge({ icon, top, bottom }: { icon: ReactNode; top: string; bottom: string }) {
  return (
    <span className="inline-flex h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/8 px-4 text-white opacity-90 transition hover:opacity-100">
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium text-white/70">{top}</span>
        <span className="block text-[14px] font-bold">{bottom}</span>
      </span>
    </span>
  );
}

export function DownloadCta() {
  return (
    <section id="download" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B5338] to-[#063B28] px-6 py-16 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(0,223,129,0.25),_transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(5,150,105,0.3),_transparent_70%)]" />

        <div className="relative">
          <h2 className="text-[clamp(24px,4vw,36px)] font-extrabold tracking-tight">
            Get TrackKaro on your phone
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[#D1FAE5]">
            One app for expenses, khata, groups and deals — in the language you&rsquo;re comfortable in.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <StoreBadge
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.6.32-1.15.83-1.44L14.5 12 3.83 21.94A1.68 1.68 0 0 1 3 20.5Zm12.4-7.66 2.85-2.85 3.35 1.9c.9.5.9 1.76 0 2.26l-3.35 1.9-2.85-2.85ZM4.5 2.3 15.6 10.9l-2.7 2.7-9.8-9.8c.3-.7.9-1.24 1.4-1.5Zm11.1 12.8 2.7 2.7-11.1 6.9c-.5-.2-1-.7-1.3-1.3l9.7-8.3Z"/></svg>
              }
              top="GET IT ON"
              bottom="Google Play"
            />
            <StoreBadge
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.94.11 1.86-.6 3.24-.68 1.65-.1 2.9.65 3.73 1.96-3.4 2.04-2.85 6.53.52 7.94-.6 1.36-1.38 2.72-2.57 3.95ZM12.03 7.25c-.17-2.02 1.5-3.83 3.4-4-.24 2.1-2.13 3.9-3.4 4Z"/></svg>
              }
              top="DOWNLOAD ON THE"
              bottom="App Store"
            />
          </div>
          <p className="mt-4 text-[12px] font-semibold text-[#A7F3D0]">Launching soon — join the waitlist by following along on your app store of choice.</p>
        </div>
      </div>
    </section>
  );
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://trackkaro.com";

export const SITE = {
  name: "TrackKaro",
  tagline: "AI-Powered Personal Finance, Digital Ledger & Group Expense Management",
  description:
    "TrackKaro brings together expense tracking, a digital bahi khata ledger, shared group expenses, live Amazon India deals with an AI purchase conscience, and smart bill reminders in one privacy-first app for India.",
  url: siteUrl,
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@trackkaro.com",
  privacyEmail:
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() || "privacy@trackkaro.com",
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
    "https://www.instagram.com/trackkaro.app/",
  instagramHandle: "@trackkaro.app",
  /** Set NEXT_PUBLIC_GOOGLE_PLAY_URL when the listing is live. */
  playStoreUrl: process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim() || "",
  /** Set NEXT_PUBLIC_APP_STORE_URL when the listing is live. */
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "",
  isPlayStoreLive: Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim()),
  isAppStoreLive: Boolean(process.env.NEXT_PUBLIC_APP_STORE_URL?.trim()),
} as const;

export const isAnyStoreLive = SITE.isPlayStoreLive || SITE.isAppStoreLive;

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#comparison", label: "Compare" },
  { href: "/#download", label: "Launch" },
] as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

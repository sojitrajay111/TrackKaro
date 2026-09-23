export const SITE = {
  name: "TrackKaro",
  tagline: "AI-Powered Personal Finance, Digital Ledger & Group Expense Management",
  description:
    "TrackKaro brings together expense tracking, a digital bahi khata ledger, shared group expenses, AI-powered insights and smart deal discovery in one privacy-first app for India.",
  // TODO: replace with your real production domain and support inbox before this site goes live.
  url: "https://trackkaro.app",
  supportEmail: "support@trackkaro.app",
  privacyEmail: "privacy@trackkaro.app",
} as const;

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
] as const;

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

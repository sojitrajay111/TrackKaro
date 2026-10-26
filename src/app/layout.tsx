import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/store/provider";
import { I18nProvider } from "@/i18n";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SITE } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The saved theme (cookie set by ThemeProvider) is applied on the server, so the first paint is
  // already right without an inline script. "system" leaves it unset; CSS follows the device.
  const saved = (await cookies()).get("theme")?.value;
  const dataTheme = saved === "dark" || saved === "light" ? saved : undefined;
  return (
    <html lang="en" className={`${manrope.variable} h-full`} data-theme={dataTheme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Geist+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.className} flex min-h-full flex-col antialiased`}>
        <ThemeProvider>
          <StoreProvider>
            <I18nProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </I18nProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

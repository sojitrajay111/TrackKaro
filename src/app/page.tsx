import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { DownloadCta } from "@/components/sections/download-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <DownloadCta />
    </>
  );
}

import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useRevealObserver } from "@/hooks/useReveal";
import Hero from "@/sections/home/Hero";
import { TransformationSection, PhilosophyBand } from "@/sections/home/Pipeline";
import HowItWorks from "@/sections/home/HowItWorks";
import BeforeAfter from "@/sections/home/BeforeAfter";
import WhatYouGet from "@/sections/home/WhatYouGet";
import EditOnce from "@/sections/home/EditOnce";
import { FigmaSection, GuidelinesSection } from "@/sections/home/Outputs";
import { PortalSection, AiSection } from "@/sections/home/PortalAi";
import { PricingSection, FaqSection, FinalCta } from "@/sections/home/ClosingSections";

export default function Home() {
  useRevealObserver();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <TransformationSection />
        <PhilosophyBand />
        <HowItWorks />
        <BeforeAfter />
        <WhatYouGet />
        <EditOnce />
        <FigmaSection />
        <GuidelinesSection />
        <PortalSection />
        <AiSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

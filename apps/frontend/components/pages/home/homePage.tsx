import CuponesShowcase from "@/components/sections/Cupones/CuponesShowcase";
import CTASection from "@/components/sections/CTA/ctaSection";
import FAQCTASection from "@/components/sections/FAQ/faqCTA";
import FounderQuote from "@/components/sections/FounderQuote/founderQuote";
import HeroSection from "@/components/sections/Hero/heroSection";
import HowItWorksSection from "@/components/sections/HowItWorks/howItWorksSection";
import PartnersSection from "@/components/sections/Partners/partnersSection";
import SponsorsSection from "@/components/sections/Sponsors/sponsorsSection";
import WhyDonateSection from "@/components/sections/WhyDonate/whyDonateSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FounderQuote />
      <HowItWorksSection />
      <CuponesShowcase />
      <SponsorsSection />
      <PartnersSection />
      <WhyDonateSection />
      <CTASection />
      <FAQCTASection />
    </div>
  );
}

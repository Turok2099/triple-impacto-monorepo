import dynamic from "next/dynamic";
import HeroSection from "@/components/sections/Hero/heroSection";
import HomeBannersCarousel from "@/components/sections/HomeBanners/homeBannersCarousel";
import HomeBannersMobileCarousel from "@/components/sections/HomeBanners/homeBannersMobileCarousel";

const AboutProjectSection = dynamic(() => import("@/components/sections/AboutProject/aboutProject"));
const HowItWorksSection = dynamic(() => import("@/components/sections/HowItWorks/howItWorksSection"));
const CuponesShowcase = dynamic(() => import("@/components/sections/Cupones/CuponesShowcase"));
const CouponCounter = dynamic(() => import("@/components/sections/CouponCounter/couponCounter"));
const SponsorsSection = dynamic(() => import("@/components/sections/Sponsors/sponsorsSection"));
const PartnersSection = dynamic(() => import("@/components/sections/Partners/partnersSection"));
const JoinUsSection = dynamic(() => import("@/components/sections/JoinUs/joinUsSection"));
const FounderQuote = dynamic(() => import("@/components/sections/FounderQuote/founderQuote"));
const WhyDonateSection = dynamic(() => import("@/components/sections/WhyDonate/whyDonateSection"));
const CTASection = dynamic(() => import("@/components/sections/CTA/ctaSection"));
const FAQCTASection = dynamic(() => import("@/components/sections/FAQ/faqCTA"));

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <HomeBannersCarousel />
      <HomeBannersMobileCarousel />
      <AboutProjectSection />
      <HowItWorksSection />
      <CuponesShowcase />
      <CouponCounter />
      <SponsorsSection />
      <PartnersSection />
      <JoinUsSection />
      <FounderQuote />
      <WhyDonateSection />
      <CTASection />
      <FAQCTASection />
    </div>
  );
}

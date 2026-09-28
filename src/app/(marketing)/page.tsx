import { Hero } from '@/components/marketing/Hero';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Showcase } from '@/components/marketing/Showcase';
import { PricingGrid } from '@/components/marketing/PricingGrid';
import { FAQList } from '@/components/marketing/FAQList';
import { CTABand } from '@/components/marketing/CTABand';

// Section 4.3's index.html port. No design reference file (pulseq-site.zip / index.html) was
// provided to this build — Phase 1's DECISIONS.md already flagged this and deferred the actual
// port to this phase — so "pixel-for-pixel" isn't achievable here; this is a conventional
// interpretation of the named component list, using the existing placeholder token system and
// real copy drawn from PulseQ_PRD.md rather than lorem ipsum. See DECISIONS.md.
export default function MarketingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <Showcase />
      <PricingGrid />
      <FAQList />
      <CTABand />
    </>
  );
}

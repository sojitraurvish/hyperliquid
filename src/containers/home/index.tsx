import { Header } from '@/components/sections/header';
import { HeroSection } from '@/components/sections/home/HeroSection';
import { MetricsSection } from '@/components/sections/home/MetricsSection';
import { FeaturesSection } from '@/components/sections/home/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/home/HowItWorksSection';
import { CTASection } from '@/components/sections/home/CTASection';
import { Footer } from '@/components/sections/home/Footer';

export default function HomeContainer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 overflow-x-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <Header />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <HeroSection />
        <MetricsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}

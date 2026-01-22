import { Header } from '@/components/sections/header';
import { HeroSection } from '@/components/sections/home/HeroSection';
import { MetricsSection } from '@/components/sections/home/MetricsSection';
import { FeaturesSection } from '@/components/sections/home/FeaturesSection';
import { CTASection } from '@/components/sections/home/CTASection';
import { Footer } from '@/components/sections/home/Footer';

export default function HomeContainer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950">
        <Header />
      </div>

      {/* Main Content with padding for fixed header */}
      <div className="flex-1 pt-14">
        <HeroSection />
        <MetricsSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}


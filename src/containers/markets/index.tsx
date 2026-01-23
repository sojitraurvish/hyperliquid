import { Header } from '@/components/sections/header';
import { Footer } from '@/components/sections/home/Footer';
import { MarketsHeroSection } from '@/components/sections/markets/MarketsHeroSection';
import { MarketsTable } from '@/components/sections/markets/MarketsTable';

export default function MarketsContainer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950">
        <Header />
      </div>

      {/* Main Content with padding for fixed header */}
      <div className="flex-1 pt-14">
        <MarketsHeroSection />
        <MarketsTable />
        <Footer />
      </div>
    </div>
  );
}





import { Header } from '@/components/sections/header';
import { Footer } from '@/components/sections/home/Footer';
import { SupportContent } from '@/components/sections/support';

export default function SupportContainer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950">
        <Header />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 pt-14">
        <SupportContent />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}





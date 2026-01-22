import { Header } from '@/components/sections/header';
import { Footer } from '@/components/sections/home/Footer';
import { BlogContent } from '@/components/sections/blog';

export default function BlogContainer() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950">
        <Header />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 pt-14">
        <BlogContent />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}


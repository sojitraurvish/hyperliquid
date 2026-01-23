import BlogContainer from '@/containers/blog';
import { CustomHead } from '@/components/seo';
import { ROUTES } from '@/lib/config';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function BlogPage() {
  const metaTitle = "Blog | Hyper Trading - Market Analysis & Trading Insights";
  const metaDesc = "Stay informed with the latest market analysis, trading strategies, and platform updates from Hyper Trading.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.BLOG}`;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="crypto blog, trading strategies, market analysis, hyperliquid news, trading insights"
        title={metaTitle}
      />
      <BlogContainer />
    </>
  );
}


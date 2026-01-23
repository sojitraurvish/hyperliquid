import HomeContainer from '@/containers/home';
import { CustomHead, CustomScriptHomePage } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';

export default function HomePage() {
  const metaTitle = "Hyper Trading | Advanced Hyperliquid Trading Platform";
  const metaDesc = "Professional trading platform for Hyperliquid. Execute trades, monitor positions, and manage your portfolio with advanced tools and real-time market data.";
  const pageFullPath = WEB_URL + ROUTES.HOME;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="hyperliquid, crypto trading, perpetual futures, decentralized exchange, trading platform, crypto derivatives"
        title={metaTitle}
      />
      <CustomScriptHomePage metaTitle={metaTitle} metaDesc={metaDesc} />
      <HomeContainer />
    </>
  );
}


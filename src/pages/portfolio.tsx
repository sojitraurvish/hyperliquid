import PortfolioContainer from '@/containers/portfolio';
import { CustomHead } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';

export default function PortfolioPage() {
  const metaTitle = "Portfolio | Hyper Trading - Manage Your Trading Positions";
  const metaDesc = "Manage your positions, track performance, and monitor your trading portfolio on Hyper Trading. View open positions, orders, and trade history.";
  const pageFullPath = WEB_URL + ROUTES.PORTFOLIO;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="trading portfolio, crypto portfolio, position management, trading dashboard, hyperliquid portfolio"
        title={metaTitle}
      />
      <PortfolioContainer />
    </>
  );
}


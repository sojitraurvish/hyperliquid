import PortfolioContainer from '@/containers/portfolio';
import { CustomHead } from '@/components/seo';
import { ROUTES } from '@/lib/config';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function PortfolioPage() {
  const metaTitle = "Portfolio | Hyper Trading - Manage Your Trading Positions";
  const metaDesc = "Manage your positions, track performance, and monitor your trading portfolio on Hyper Trading. View open positions, orders, and trade history.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.PORTFOLIO}`;
  
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


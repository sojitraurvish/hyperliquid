import MarketsContainer from '@/containers/markets';
import { CustomHead } from '@/components/seo';
import { ROUTES } from '@/lib/config';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function MarketsPage() {
  const metaTitle = "Markets | Hyper Trading - Trade 100+ Cryptocurrency Markets";
  const metaDesc = "Access perpetual futures on all major cryptocurrencies with deep liquidity and tight spreads. Trade with up to 50x leverage on Hyper Trading.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.MARKETS}`;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="crypto markets, perpetual futures, trading pairs, cryptocurrency trading, hyperliquid markets"
        title={metaTitle}
      />
      <MarketsContainer />
    </>
  );
}



import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMarketStore } from '@/store/market';
import { ROUTES } from '@/lib/config';
import { CustomHead } from '@/components/seo';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function TradePage() {
  const router = useRouter();
  const { selectedMarket } = useMarketStore();

  useEffect(() => {
    // Redirect to dynamic route with market
    if (router.isReady) {
      const marketCoin = selectedMarket?.coin?.toUpperCase() || 'BTC';
      router.replace(`${ROUTES.TRADE}/${marketCoin}`);
    }
  }, [router.isReady, selectedMarket, router]);

  const metaTitle = "Trade | Hyper Trading - Advanced Trading Platform";
  const metaDesc = "Trade perpetual futures with advanced tools, real-time charts, and deep liquidity. Execute trades with up to 50x leverage on Hyper Trading.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.TRADE}`;

  // Return loading state while redirecting
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="crypto trading, perpetual futures trading, hyperliquid trading, leverage trading"
        title={metaTitle}
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    </>
  );
}

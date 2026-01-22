import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMarketStore } from '@/store/market';
import { ROUTES } from '@/lib/config';

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

  // Return loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}

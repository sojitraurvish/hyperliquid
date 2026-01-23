import TradeContainer from '@/containers/trade';
import { CustomHead } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';
import { GetServerSideProps } from 'next';

interface TradePageProps {
  marketSymbol: string;
}

export default function TradePage({ marketSymbol }: TradePageProps) {
  const metaTitle = `Trade ${marketSymbol} | Hyper Trading - ${marketSymbol} Perpetual Futures`;
  const metaDesc = `Trade ${marketSymbol} perpetual futures with advanced tools, real-time charts, and deep liquidity. Execute trades with up to 50x leverage on Hyper Trading.`;
  const pageFullPath = WEB_URL + `${ROUTES.TRADE}/${marketSymbol}`;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords={`${marketSymbol} trading, ${marketSymbol} perpetual futures, crypto trading, hyperliquid ${marketSymbol}`}
        title={metaTitle}
      />
      <TradeContainer />
    </>
  );
}

// This ensures Next.js knows this is a dynamic route
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  const marketSymbol = id ? (id as string).toUpperCase() : 'BTC';
  
  return {
    props: {
      marketSymbol,
    },
  };
};


import TradeContainer from '@/containers/trade';

export default function TradePage() {
  return <TradeContainer />;
}

// This ensures Next.js knows this is a dynamic route
export async function getServerSideProps() {
  return {
    props: {},
  };
}


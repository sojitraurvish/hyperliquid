import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import { useState } from 'react';
import { config } from "@/lib/config/wallet-adapter/wallet-adapter";
import { AppToast } from "@/components/ui/toast";
import { useThemeColors } from "@/hooks/useThemeColors";

function ThemeInitializer() {
  useThemeColors();
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  // Create a client inside the component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeInitializer />
        <Component {...pageProps} />
        <AppToast />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

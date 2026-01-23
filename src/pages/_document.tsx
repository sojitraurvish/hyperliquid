import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - SVG for modern browsers */}
        <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
        {/* Fallback ICO for older browsers - will be replaced */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/images/logo.svg" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

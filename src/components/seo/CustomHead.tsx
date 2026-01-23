import Head from "next/head";
import { APP_NAME, OG_TITLE, OG_DESC, FB_APP_ID, FavIcon, OG_IMAGE } from "@/lib/config";
import { getBaseUrl, getAbsoluteUrl } from "@/lib/utils/get-base-url";

interface CustomHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  url?: string;
  publisher?: string;
}

const defaultTitle = APP_NAME;
const defaultOGTitle = OG_TITLE;
const defaultDescription = OG_DESC;

const CustomHead = (props: CustomHeadProps) => {
  // Get current site base URL (not Hyperliquid app URL)
  const baseUrl = getBaseUrl();
  const defaultOGURL = props?.url || baseUrl;
  
  // OG Image should be absolute URL using current site domain
  const ogImageUrl = props?.ogImage 
    ? (props.ogImage.startsWith('http') ? props.ogImage : getAbsoluteUrl(props.ogImage))
    : getAbsoluteUrl(OG_IMAGE);

  return (
    <Head>
      <meta charSet="UTF-8" />
      <title>{props?.title || defaultTitle}</title>

      <meta name="keywords" content={props?.keywords || defaultTitle} />
      <meta name="publisher" content={props?.publisher ? APP_NAME + " - " + props?.publisher : APP_NAME} />

      <meta
        name="description"
        content={props?.description || defaultDescription}
      />

      <meta property="og:url" content={defaultOGURL} />
      <meta
        property="og:title"
        content={props?.ogTitle || defaultOGTitle || defaultTitle}
      />
      <meta
        property="og:description"
        content={props?.ogDescription || props?.description || defaultDescription}
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta property="og:type" content="website" />

      {/* twitter */}
      <meta name="twitter:site" content={defaultOGURL} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* og image */}
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="robots" content="noindex"/>

      <meta property="fb:app_id" content={FB_APP_ID} />
      {/* Favicon - SVG for modern browsers (prioritized) */}
      <link href={FavIcon} rel="icon" type="image/svg+xml" />
      {/* Fallback ICO for older browsers - will be generated from SVG */}
      <link href="/favicon.ico" rel="icon" type="image/x-icon" />
      {/* Apple touch icon */}
      <link rel="apple-touch-icon" href="/images/logo.svg" />
      <link rel="canonical" href={defaultOGURL} />
    </Head>
  );
};

export default CustomHead;


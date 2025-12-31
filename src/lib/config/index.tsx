import { ENVIRONMENT, ENVIRONMENT_TYPES } from "../constants";

export const API_BASE_URL = `http://localhost:9000`

export const jwtToken = "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGI1YmNiODE4ZDA5YTBjMWIwY2Y0ZSIsImlhdCI6MTc1NDA1MTIxOCwiZXhwIjoxNzU2NjQzMjE4fQ.GF3h2xAwvr-PegUXXbX7rLFrA4BTkbC4NKatt3vbScg";

export const APP_NAME = "Hyper Trading";

export const OG_TITLE = "Hyper Trading | Advanced Hyperliquid Trading Platform";
export const OG_DESC = `Professional trading platform for Hyperliquid. Execute trades, monitor positions, and manage your portfolio with advanced tools and real-time market data.`;
export const KEYWORDS = `hyperliquid, crypto trading, perpetual futures, decentralized exchange, trading platform, crypto derivatives`;

export const isTestnet =  ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
export const WEB_URL = isTestnet ? "https://app.hyperliquid-testnet.xyz" : "https://app.hyperliquid.xyz";


export const EXPLORER_URL =   `${WEB_URL}/explorer`;
export const EXPLORER_TX_URL =   `${EXPLORER_URL}/tx`;
export const HISTORICAL_ORDERS_URL =   `${WEB_URL}/historicalOrders`;
export const FUNDING_HISTORY_URL =   `${WEB_URL}/fundingHistory`;
export const TRADE_HISTORY_URL =   `${WEB_URL}/tradeHistory`;

// SEO image
export const DESK_LOGO = "/images/logo.png";
export const OG_IMAGE = DESK_LOGO;
export const SMALL_LOGO = "/images/logo.png";
export const SEO_LOGO = WEB_URL + DESK_LOGO;

// Favicon
export const FavIcon = "/images/logo.png";



export const SEO_SCHEMA={
    CONTEXT: "http://schema.org",
    TYPE:"Organization",
    NAME:APP_NAME,
    CONTACT_POINT:{
      TYPE:"ContactPoint",
      TELEPHONE:"+1-800-HYPER-TRD",
      CONTACT_TYPE:"Customer Service"
    },
    SAME_AS:["https://www.linkedin.com/company/hypertrading","https://twitter.com/hypertrading"],
    TYPE_PRIMARY:"WebSite",
    TYPE_SECONDARY:"FAQPage",
    TYPE_TERTIARY:"Question",
    TYPE_QUATERNARY:"Answer",
    POTENTIAL_ACTION:{
      TYPE:"SearchAction",
      TARGET:"{search_term_string}",
      QUERY_INPUT:"required name=search_term_string"
    }
  
  }

export const BUILDER_CONFIG = {
  BUILDER_FEE_ADDRESS: "0xb5789FbdA5C37267781Df8baD3738E911D5F500d" as `0x${string}`,
  BUILDER_FEE_RATE: 10,
} as const;
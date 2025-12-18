import { infoClient } from "../config/hyperliquied/hyperliquid-client";



export const fetchPerpetualMarkets = async () => {
  const resp = await infoClient.webData2({
    user: "0x0000000000000000000000000000000000000000",
  });
  return resp;
};
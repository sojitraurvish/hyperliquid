export interface MarginLeverageValue {
  marginMode: string;
  leverage: number;
}

export type MarginAndLeverage = {
  [key: string]: MarginLeverageValue;
};

export type OrderPayload = {
  status: "ok",
  response: {
      type: "order",
      data: {
          statuses: ({
              resting: {
                  oid: number;
                  cloid?: `0x${string}` | undefined;
              };
          } | {
              filled: {
                  totalSz: string;
                  avgPx: string;
                  oid: number;
                  cloid?: `0x${string}` | undefined;
              };
          })[];
      };
  };
}
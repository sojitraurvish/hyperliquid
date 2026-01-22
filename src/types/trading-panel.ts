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
          statuses: {
              filled?: {
                  totalSz: string;
                  avgPx: string;
                  oid: number;
                  cloid?: `0x${string}` | undefined;
              };
          }[];
      };
  };
}

export type CancelPayload = {
  status: "ok";
    response: {
        type: "cancel";
        data: {
            statuses: "success"[];
        };
    };
}
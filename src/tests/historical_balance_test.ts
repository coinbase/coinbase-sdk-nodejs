import { HistoricalBalance } from "../coinbase/historical_balance";
import { HistoricalBalance as HistoricalBalanceModel } from "../client";
import { Decimal } from "decimal.js";
import { Coinbase } from "../coinbase/coinbase";

describe("HistoricalBalance", () => {
  describe("#fromModel", () => {
    const amount = new Decimal(1);
    const historyModel: HistoricalBalanceModel = {
      amount: "1000000000000000000",
      block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
      block_height: "11349306",
      asset: {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 18,
        contract_address: "0x",
      },
    };

    const historicalBalance = HistoricalBalance.fromModel(historyModel);

    it("returns a new HistoricalBalance object with the correct amount", () => {
      expect(historicalBalance.amount).toEqual(amount);
    });

    it("returns a new HistoricalBalance object with the correct asset_id", () => {
      expect(historicalBalance.asset.assetId).toBe(Coinbase.assets.Eth);
    });

    it("returns a new HistoricalBalance object with the correct amount when empty", () => {
      const historyModel: HistoricalBalanceModel = {
        amount: "",
        block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
        block_height: "11349306",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
          contract_address: "0x",
        },
      };
      const historicalBalance = HistoricalBalance.fromModel(historyModel);

      expect(historicalBalance.amount).toEqual(new Decimal(0));
    });
  });
});

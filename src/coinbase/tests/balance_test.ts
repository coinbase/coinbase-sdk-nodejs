import { Balance } from "../balance";
import { Balance as BalanceModel } from "../../client";
import { Decimal } from "decimal.js";
import { Coinbase } from "../coinbase";

describe("Balance", () => {
  describe(".fromModel", () => {
    const amount = new Decimal(1);
    const balanceModel: BalanceModel = {
      amount: "1000000000000000000",
      asset: {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networkList.BaseSepolia,
      },
    };

    const balance = Balance.fromModel(balanceModel);

    it("returns a new Balance object with the correct amount", () => {
      expect(balance.amount).toEqual(amount);
    });

    it("returns a new Balance object with the correct asset_id", () => {
      expect(balance.assetId).toBe(Coinbase.assets.Eth);
    });
  });

  describe(".fromModelAndAssetId", () => {
    const amount = new Decimal(1);
    const balanceModel: BalanceModel = {
      asset: { asset_id: Coinbase.assets.Eth, network_id: Coinbase.networkList.BaseSepolia },
      amount: "1000000000000000000",
    };

    const balance = Balance.fromModelAndAssetId(balanceModel, Coinbase.assets.Eth);

    it("returns a new Balance object with the correct amount", () => {
      expect(balance.amount).toEqual(amount);
    });

    it("returns a new Balance object with the correct asset_id", () => {
      expect(balance.assetId).toBe(Coinbase.assets.Eth);
    });
  });
});

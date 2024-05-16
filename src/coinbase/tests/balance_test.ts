import { Balance } from "../balance";
import { Balance as BalanceModel } from "../../client";
import { Decimal } from "decimal.js";

describe("Balance", () => {
  describe(".fromModel", () => {
    const amount = new Decimal(1);
    const balanceModel: BalanceModel = {
      amount: "1000000000000000000",
      asset: {
        asset_id: "eth",
        network_id: "base-sepolia",
      },
    };

    const balance = Balance.fromModel(balanceModel);

    it("returns a new Balance object with the correct amount", () => {
      expect(balance.amount).toEqual(amount);
    });

    it("returns a new Balance object with the correct asset_id", () => {
      expect(balance.assetId).toBe("eth");
    });
  });

  describe(".fromModelAndAssetId", () => {
    const amount = new Decimal(123);
    const balanceModel: BalanceModel = {
      asset: { asset_id: "eth", network_id: "base-sepolia" },
      amount: amount.toString(),
    };

    const balance = Balance.fromModelAndAssetId(balanceModel, "ETH");

    test("returns a new Balance object with the correct amount", () => {
      expect(balance.amount.equals(amount)).toBeTruthy();
    });

    test("returns a new Balance object with the correct asset_id", () => {
      expect(balance.assetId).toBe("ETH");
    });
  });
});

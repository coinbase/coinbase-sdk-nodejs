import { BalanceMap } from "../coinbase/balance_map";
import { Balance as BalanceModel } from "../client";
import { Balance } from "../coinbase/balance";
import { Decimal } from "decimal.js";
import { Coinbase } from "../coinbase/coinbase";

describe("BalanceMap", () => {
  const ethAmount = new Decimal(1);
  const ethAtomicAmount = "1000000000000000000";
  const usdcAmount = new Decimal(2);
  const usdcAtomicAmount = "2000000";
  const wethAmount = new Decimal(3);
  const wethAtomicAmount = "3000000000000000000";

  describe(".fromBalances", () => {
    const ethBalanceModel: BalanceModel = {
      asset: {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 18,
        contract_address: "0x",
      },
      amount: ethAtomicAmount,
    };

    const usdcBalanceModel: BalanceModel = {
      asset: {
        asset_id: "usdc",
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 6,
        contract_address: "0x",
      },
      amount: usdcAtomicAmount,
    };

    const wethBalanceModel: BalanceModel = {
      asset: {
        asset_id: "weth",
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 18,
        contract_address: "0x",
      },
      amount: wethAtomicAmount,
    };

    const balances = [ethBalanceModel, usdcBalanceModel, wethBalanceModel];

    const balanceMap = BalanceMap.fromBalances(balances);

    it("returns a new BalanceMap object with the correct balances", () => {
      expect(balanceMap.get(Coinbase.assets.Eth)).toEqual(ethAmount);
      expect(balanceMap.get("usdc")).toEqual(usdcAmount);
      expect(balanceMap.get("weth")).toEqual(wethAmount);
    });
  });

  describe(".add", () => {
    const assetId = Coinbase.assets.Eth;
    const balance = Balance.fromModelAndAssetId(
      {
        amount: ethAtomicAmount,
        asset: {
          asset_id: assetId,
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
          contract_address: "0x",
        },
      },
      assetId,
    );

    const balanceMap = new BalanceMap();

    it("sets the amount", () => {
      balanceMap.add(balance);
      expect(balanceMap.get(assetId)).toEqual(ethAmount);
    });

    it("throws an error if the balance parameter is not instance of Balance", () => {
      expect(() => balanceMap.add(null!)).toThrow(Error);
    });
  });

  describe(".toString", () => {
    const assetId = Coinbase.assets.Eth;
    const balance = Balance.fromModelAndAssetId(
      {
        amount: ethAtomicAmount,
        asset: {
          asset_id: assetId,
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
          contract_address: "0x",
        },
      },
      assetId,
    );

    const balanceMap = new BalanceMap();
    balanceMap.add(balance);

    it("returns a string representation of asset_id to floating-point number", () => {
      expect(balanceMap.toString()).toBe(`BalanceMap{"${assetId}":"${ethAmount}"}`);
    });
  });
});

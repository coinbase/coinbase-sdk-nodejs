import Decimal from "decimal.js";
import { Coinbase } from "../coinbase/coinbase";
import { GWEI_DECIMALS } from "../coinbase/constants";
import { Asset } from "./../coinbase/asset";

describe("Asset", () => {
  describe(".fromModel", () => {
    it("should return an Asset object", () => {
      const model = {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "0x",
        decimals: 18,
      };
      const asset = Asset.fromModel(model);
      expect(asset).toBeInstanceOf(Asset);
      expect(asset.getAssetId()).toEqual(Coinbase.assets.Eth);
    });

    describe("when the model is invalid", () => {
      it("should throw an error", () => {
        expect(() => Asset.fromModel(null!)).toThrow("Invalid asset model");
      });
    });

    describe("when the asset_id is gwei", () => {
      it("should set the decimals to 9", () => {
        const model = {
          asset_id: "eth",
          network_id: Coinbase.networks.BaseSepolia,
          contract_address: "0x",
          decimals: 18,
        };
        expect(Asset.fromModel(model, Coinbase.assets.Gwei).decimals).toEqual(GWEI_DECIMALS);
      });
    });
    describe("when the asset_id is wei", () => {
      it("should set the decimals to 0", () => {
        const model = {
          asset_id: "eth",
          network_id: Coinbase.networks.BaseSepolia,
          contract_address: "0x",
          decimals: 18,
        };
        expect(Asset.fromModel(model, Coinbase.assets.Wei).decimals).toEqual(0);
      });
    });
  });

  describe("#toString", () => {
    it("should return the assetId", () => {
      const asset = Asset.fromModel({
        asset_id: "eth",
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "contractAddress",
        decimals: 18,
      });
      expect(asset.toString()).toEqual(
        `Asset{ networkId: base-sepolia, assetId: eth, contractAddress: contractAddress, decimals: 18 }`,
      );
    });
  });

  describe(".primaryDenomination", () => {
    ["wei", "gwei"].forEach(assetId => {
      describe(`when the assetId is ${assetId}`, () => {
        it("should return 'eth'", () => {
          expect(Asset.primaryDenomination(assetId)).toEqual("eth");
        });
      });
    });

    describe("when the assetId is not wei or gwei", () => {
      it("should return the assetId", () => {
        expect(Asset.primaryDenomination("other")).toEqual("other");
      });
    });
  });

  describe("#toAtomicAmount", () => {
    it("should return the atomic amount", () => {
      const asset = Asset.fromModel({
        asset_id: "eth",
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "contractAddress",
        decimals: 18,
      });
      const atomicAmount = asset.toAtomicAmount(new Decimal(1.23));
      expect(atomicAmount).toEqual(BigInt(1230000000000000000));
    });

    it("should handle large numbers without using scientific notation", () => {
      const asset = Asset.fromModel({
        asset_id: "eth",
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "contractAddress",
        decimals: 18,
      });
      const atomicAmount = asset.toAtomicAmount(new Decimal(2000));
      expect(atomicAmount).toEqual(BigInt(2000000000000000000000));
      expect(atomicAmount.toString()).not.toContain("e");
    });
  });
});

import { Wallet } from "../coinbase/wallet";
import { WalletAddress } from "../coinbase/address/wallet_address";
import { FundOperation } from "../coinbase/fund_operation";
import { FundQuote } from "../coinbase/fund_quote";
import { newAddressModel } from "./utils";
import { Decimal } from "decimal.js";
import { Coinbase } from "..";
import { FeatureSet, Wallet as WalletModel } from "../client/api";

describe("Wallet Fund", () => {
  let wallet: Wallet;
  let walletModel: WalletModel;
  let defaultAddress: WalletAddress;
  const walletId = "test-wallet-id";
  const addressId = "0x123abc...";

  beforeEach(() => {
    const addressModel = newAddressModel(walletId, addressId);
    defaultAddress = new WalletAddress(addressModel);

    walletModel = {
      id: walletId,
      network_id: Coinbase.networks.BaseSepolia,
      default_address: addressModel,
      feature_set: {} as FeatureSet,
    };

    wallet = Wallet.init(walletModel, "");

    // Mock getDefaultAddress to return our test address
    jest.spyOn(wallet, "getDefaultAddress").mockResolvedValue(defaultAddress);

    // Mock the fund and quoteFund methods on the default address
    jest.spyOn(defaultAddress, "fund").mockResolvedValue({} as FundOperation);
    jest.spyOn(defaultAddress, "quoteFund").mockResolvedValue({} as FundQuote);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("#fund", () => {
    it("should call defaultAddress.fund with correct parameters when passing in decimal amount", async () => {
      const amount = new Decimal("1.0");
      const assetId = "eth";

      await wallet.fund(amount, assetId);

      expect(defaultAddress.fund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should call defaultAddress.fund with correct parameters when passing in number amount", async () => {
      const amount = 1;
      const assetId = "eth";

      await wallet.fund(amount, assetId);

      expect(defaultAddress.fund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should call defaultAddress.fund with correct parameters when passing in bigint amount", async () => {
      const amount = BigInt(1);
      const assetId = "eth";

      await wallet.fund(amount, assetId);

      expect(defaultAddress.fund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should throw error if default address does not exist", async () => {
      jest
        .spyOn(wallet, "getDefaultAddress")
        .mockRejectedValue(new Error("Default address does not exist"));

      const amount = new Decimal("1.0");
      const assetId = "eth";

      await expect(wallet.fund(amount, assetId)).rejects.toThrow("Default address does not exist");
    });
  });

  describe("#quoteFund", () => {
    it("should call defaultAddress.quoteFund with correct parameters when passing in decimal amount", async () => {
      const amount = new Decimal("1.0");
      const assetId = "eth";

      await wallet.quoteFund(amount, assetId);

      expect(defaultAddress.quoteFund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should call defaultAddress.quoteFund with correct parameters when passing in number amount", async () => {
      const amount = 1;
      const assetId = "eth";

      await wallet.quoteFund(amount, assetId);

      expect(defaultAddress.quoteFund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should call defaultAddress.quoteFund with correct parameters when passing in bigint amount", async () => {
      const amount = BigInt(1);
      const assetId = "eth";

      await wallet.quoteFund(amount, assetId);

      expect(defaultAddress.quoteFund).toHaveBeenCalledWith(amount, assetId);
    });

    it("should throw error if default address does not exist", async () => {
      jest
        .spyOn(wallet, "getDefaultAddress")
        .mockRejectedValue(new Error("Default address does not exist"));

      const amount = new Decimal("1.0");
      const assetId = "eth";

      await expect(wallet.quoteFund(amount, assetId)).rejects.toThrow(
        "Default address does not exist",
      );
    });
  });
});

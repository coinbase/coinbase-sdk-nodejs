import { Wallet } from "../coinbase/wallet";
import { WalletAddress } from "../coinbase/address/wallet_address";
import { newAddressModel } from "./utils";
import { Coinbase, Transfer } from "..";
import { FeatureSet, Wallet as WalletModel } from "../client/api";

describe("Wallet Transfer", () => {
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

    // Mock the createTransfer method on the default address
    jest.spyOn(defaultAddress, "createTransfer").mockResolvedValue({} as Transfer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("#createTransfer", () => {
    it("should pass through skipBatching to defaultAddress.createTransfer", async () => {
      const assetId = "eth";

      await wallet.createTransfer({
        amount: 1,
        assetId,
        destination: "0x123abc...",
        gasless: true,
        skipBatching: true,
      });

      expect(defaultAddress.createTransfer).toHaveBeenCalledWith({
        amount: 1,
        assetId,
        destination: "0x123abc...",
        gasless: true,
        skipBatching: true,
      });

      await wallet.createTransfer({
        amount: 1,
        assetId,
        destination: "0x123abc...",
        gasless: true,
        skipBatching: false,
      });

      expect(defaultAddress.createTransfer).toHaveBeenCalledWith({
        amount: 1,
        assetId,
        destination: "0x123abc...",
        gasless: true,
        skipBatching: false,
      });
    });
  });
});

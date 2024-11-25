import { WalletAddress } from "../coinbase/address/wallet_address";
import { FundOperation } from "../coinbase/fund_operation";
import { FundQuote } from "../coinbase/fund_quote";
import { newAddressModel } from "./utils";
import { Decimal } from "decimal.js";

describe("WalletAddress Fund", () => {
  let walletAddress: WalletAddress;
  const walletId = "test-wallet-id";
  const addressId = "0x123abc...";

  beforeEach(() => {
    walletAddress = new WalletAddress(newAddressModel(walletId, addressId));

    jest.spyOn(FundOperation, "create").mockResolvedValue({} as FundOperation);
    jest.spyOn(FundQuote, "create").mockResolvedValue({} as FundQuote);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("#fund", () => {
    it("should call FundOperation.create with correct parameters when passing in decimal amount", async () => {
      const amount = new Decimal("1.0");
      const assetId = "eth";

      await walletAddress.fund(amount, assetId);

      expect(FundOperation.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        amount,
        assetId,
        walletAddress.getNetworkId(),
      );
    });
    it("should call FundOperation.create with correct parameters when passing in number amount", async () => {
      const amount = 1;
      const assetId = "eth";

      await walletAddress.fund(amount, assetId);

      expect(FundOperation.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        new Decimal(amount),
        assetId,
        walletAddress.getNetworkId(),
      );
    });
    it("should call FundOperation.create with correct parameters when passing in bigint amount", async () => {
      const amount = BigInt(1);
      const assetId = "eth";

      await walletAddress.fund(amount, assetId);

      expect(FundOperation.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        new Decimal(amount.toString()),
        assetId,
        walletAddress.getNetworkId(),
      );
    });
  });

  describe("#quoteFund", () => {
    it("should call FundQuote.create with correct parameters when passing in decimal amount", async () => {
      const amount = new Decimal("1.0");
      const assetId = "eth";

      await walletAddress.quoteFund(amount, assetId);

      expect(FundQuote.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        amount,
        assetId,
        walletAddress.getNetworkId(),
      );
    });
    it("should call FundQuote.create with correct parameters when passing in number amount", async () => {
      const amount = 1;
      const assetId = "eth";

      await walletAddress.quoteFund(amount, assetId);

      expect(FundQuote.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        new Decimal(amount),
        assetId,
        walletAddress.getNetworkId(),
      );
    });
    it("should call FundQuote.create with correct parameters when passing in bigint amount", async () => {
      const amount = BigInt(1);
      const assetId = "eth";

      await walletAddress.quoteFund(amount, assetId);

      expect(FundQuote.create).toHaveBeenCalledWith(
        walletId,
        addressId,
        new Decimal(amount.toString()),
        assetId,
        walletAddress.getNetworkId(),
      );
    });
  });
});

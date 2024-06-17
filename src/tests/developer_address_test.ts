/* eslint-disable @typescript-eslint/no-explicit-any */
import * as crypto from "crypto";
import { ethers } from "ethers";
import { FaucetTransaction } from "../faucet_transaction";
import { Balance as BalanceModel, TransferList, Trade as TradeModel } from "../../client";
import Decimal from "decimal.js";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import {
  VALID_ADDRESS_BALANCE_LIST,
  VALID_ADDRESS_MODEL,
  VALID_TRANSFER_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  tradeApiMock,
  transfersApiMock,
} from "./utils";
import { ArgumentError } from "../errors";
import { Transfer } from "../transfer";
import { TransactionStatus, TransferStatus } from "../types";
import { Trade } from "../trade";
import { Transaction } from "../transaction";
import { Asset } from "../asset";
import { DeveloperAddress } from "../address/developer_address";

// Test suite for the DeveloperAddress class
describe("DeveloperAddress", () => {
  const transactionHash = generateRandomHash();
  let address: DeveloperAddress;
  let balanceModel: BalanceModel;
  let key;

  beforeEach(() => {
    Coinbase.apiClients.address = addressesApiMock;
    Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
      const { asset_id } = request;
      balanceModel = {
        amount: "1000000000000000000",
        asset: {
          asset_id,
          network_id: Coinbase.networks.BaseSepolia,
        },
      };
      return { data: balanceModel };
    });
    Coinbase.apiClients.address!.listAddressBalances = mockFn(() => {
      return { data: VALID_ADDRESS_BALANCE_LIST };
    });
    Coinbase.apiClients.address!.requestFaucetFunds = mockFn(() => {
      return { data: { transaction_hash: transactionHash } };
    });
  });

  beforeEach(() => {
    key = ethers.Wallet.createRandom();
    address = new DeveloperAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.SigningKey);

    jest.clearAllMocks();
  });

  it("should initialize a new DeveloperAddress", () => {
    expect(address).toBeInstanceOf(DeveloperAddress);
  });

  it("should return the address ID", () => {
    expect(address.getId()).toBe(VALID_ADDRESS_MODEL.address_id);
  });

  it("should return the network ID", () => {
    expect(address.getNetworkId()).toBe(VALID_ADDRESS_MODEL.network_id);
  });

  it("should return the correct list of balances", async () => {
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assets.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledTimes(1);
  });

  it("should return the correct ETH balance", async () => {
    const ethBalance = await address.getBalance(Coinbase.assets.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return 0 balance when the response is empty", async () => {
    Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(null);
    const ethBalance = await address.getBalance(Coinbase.assets.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(0));
  });

  it("should return the correct Gwei balance", async () => {
    const assetId = "gwei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000"));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Wei balance", async () => {
    const assetId = "wei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000000000000"));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return an error for an unsupported asset", async () => {
    const getAddressBalance = mockReturnRejectedValue(new APIError(""));
    const assetId = "unsupported-asset";
    Coinbase.apiClients.address!.getAddressBalance = getAddressBalance;
    await expect(address.getBalance(assetId)).rejects.toThrow(APIError);
    expect(getAddressBalance).toHaveBeenCalledWith(address.getWalletId(), address.getId(), assetId);
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the wallet ID", () => {
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an InternalError when model is not provided", () => {
    expect(() => new DeveloperAddress(null!, key as unknown as ethers.SigningKey)).toThrow(
      `Address model cannot be empty`,
    );
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(new APIError(""));
    await expect(address.faucet()).rejects.toThrow(APIError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new FaucetLimitReachedError(""),
    );
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new InternalError(""),
    );
    await expect(address.faucet()).rejects.toThrow(InternalError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:DeveloperAddress{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });

  describe(".createTransfer", () => {
    let weiAmount, destination, intervalSeconds, timeoutSeconds;
    let walletId, id;

    beforeEach(() => {
      weiAmount = new Decimal("500000000000000000");
      destination = new DeveloperAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.SigningKey);
      intervalSeconds = 0.2;
      timeoutSeconds = 10;
      walletId = crypto.randomUUID();
      id = crypto.randomUUID();
      Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
        const { asset_id } = request;
        balanceModel = {
          amount: "1000000000000000000",
          asset: {
            asset_id,
            network_id: Coinbase.networks.BaseSepolia,
          },
        };
        return { data: balanceModel };
      });

      Coinbase.apiClients.transfer = transfersApiMock;
    });

    it("should successfully create and complete a transfer", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await address.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should throw an APIError if the createTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnRejectedValue(
        new APIError("Failed to create transfer"),
      );
      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(APIError);
    });

    it("should throw an InternalError if the address key is not provided", async () => {
      const addressWithoutKey = new DeveloperAddress(VALID_ADDRESS_MODEL, null!);
      await expect(
        addressWithoutKey.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(InternalError);
    });

    it("should throw an APIError if the broadcastTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(APIError);
    });

    it("should throw an Error if the transfer times out", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.BROADCAST,
      });
      intervalSeconds = 0.000002;
      timeoutSeconds = 0.000002;

      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow("Transfer timed out");
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        address.createTransfer(
          insufficientAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create and complete a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await address.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe(".getTransfers", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const pages = ["abc", "def"];
      const response = {
        data: [VALID_TRANSFER_MODEL],
        has_more: false,
        next_page: "",
        total_count: 0,
      } as TransferList;
      Coinbase.apiClients.transfer!.listTransfers = mockFn((walletId, addressId) => {
        VALID_TRANSFER_MODEL.wallet_id = walletId;
        VALID_TRANSFER_MODEL.address_id = addressId;
        response.next_page = pages.shift() as string;
        response.data = [VALID_TRANSFER_MODEL];
        response.has_more = !!response.next_page;
        return { data: response };
      });
    });

    it("should return the list of transfers", async () => {
      const transfers = await address.listTransfers();
      expect(transfers).toHaveLength(3);
      expect(transfers[0]).toBeInstanceOf(Transfer);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(3);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        100,
        undefined,
      );
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        100,
        "abc",
      );
    });

    it("should raise an APIError when the API call fails", async () => {
      jest.clearAllMocks();
      Coinbase.apiClients.transfer!.listTransfers = mockReturnRejectedValue(new APIError(""));
      await expect(address.listTransfers()).rejects.toThrow(APIError);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(1);
    });
  });

  describe("#trade", () => {
    let addressId;
    let toAddressId;
    let ethBalanceResponse;
    let usdcBalanceResponse;
    let tradeId;
    let transactionHash;
    let unsignedPayload;
    let signedPayload;
    let broadcastTradeRequest;
    let transaction;
    let approveTransaction;
    let createdTrade;
    let transactionModel;
    let tradeModel;
    let broadcastedTransactionModel;
    let broadcastedTradeModel;
    let broadcastedTrade;
    let fromAssetId;
    let normalizedFromAssetId;
    let toAssetId;
    let balanceResponse;
    let destination;
    let amount;
    let useServerSigner;

    beforeEach(() => {
      addressId = "address_id";
      ethBalanceResponse = { amount: "1000000000000000000", asset: "eth" };
      usdcBalanceResponse = { amount: "10000000000", asset: "usdc" };
      tradeId = crypto.randomUUID();
      transactionHash = "0xdeadbeef";
      unsignedPayload = "unsigned_payload";
      signedPayload = "signed_payload";
      broadcastTradeRequest = { signed_payload: signedPayload };
      transaction = { sign: jest.fn().mockReturnValue(signedPayload) } as unknown as Transaction;
      approveTransaction = null;
      createdTrade = {
        id: tradeId,
        transaction: transaction,
        approve_transaction: approveTransaction,
      } as unknown as Trade;
      transactionModel = {
        status: "pending",
        unsigned_payload: unsignedPayload,
      } as unknown as TradeModel;
      tradeModel = {
        transaction: transactionModel,
        address_id: addressId,
      } as unknown as TradeModel;
      broadcastedTransactionModel = {
        status: "broadcast",
        unsigned_payload: unsignedPayload,
        signed_payload: signedPayload,
      } as unknown as TradeModel;
      broadcastedTradeModel = {
        transaction: broadcastedTransactionModel,
        address_id: addressId,
      } as unknown as TradeModel;
      broadcastedTrade = {
        transaction: transaction,
        id: tradeId,
      } as unknown as Trade;
      fromAssetId = "eth";
      normalizedFromAssetId = "eth";
      toAssetId = "usdc";
      balanceResponse = ethBalanceResponse;
      destination = toAddressId;
      amount = new Decimal(0.5);
      useServerSigner = false;
    });

    describe("when the trade is successful", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        Coinbase.apiClients.trade = tradeApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(balanceResponse);
        Coinbase.apiClients.trade!.createTrade = mockReturnValue(tradeModel);
        jest.spyOn(Transaction.prototype, "sign").mockReturnValue(signedPayload);
      });

      it("should return the broadcasted trade", async () => {
        Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
        const result = await address.createTrade(amount, fromAssetId, toAssetId);
        const transaction = result.getTransaction();
        expect(transaction.getSignedPayload()).toEqual(signedPayload);
        expect(transaction.getStatus()).toEqual(TransactionStatus.BROADCAST);
        expect(transaction.getUnsignedPayload()).toEqual(unsignedPayload);
        expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
          address.getWalletId(),
          address.getId(),
          {
            amount: Asset.toAtomicAmount(amount, fromAssetId).toString(),
            from_asset_id: normalizedFromAssetId,
            to_asset_id: toAssetId,
          },
        );
      });

      it("should sign the transaction with the key", async () => {
        Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
        const result = await address.createTrade(amount, fromAssetId, toAssetId);
        const transaction = result.getTransaction();
        const wallet = new ethers.Wallet(key.privateKey);
        expect(transaction.sign).toHaveBeenCalledWith(wallet);
      });

      describe("when the asset is Gwei", () => {
        beforeEach(() => {
          fromAssetId = "gwei";
          normalizedFromAssetId = "eth";
          amount = new Decimal(500000000);
        });

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: Asset.toAtomicAmount(amount, fromAssetId).toString(),
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          const wallet = new ethers.Wallet(key.privateKey);
          expect(transaction.sign).toHaveBeenCalledWith(wallet);
        });
      });

      describe("when the asset is ETH", () => {
        beforeEach(() => {
          fromAssetId = "eth";
          normalizedFromAssetId = "eth";
          amount = new Decimal(0.5);
        });

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: Asset.toAtomicAmount(amount, fromAssetId).toString(),
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          const wallet = new ethers.Wallet(key.privateKey);
          expect(transaction.sign).toHaveBeenCalledWith(wallet);
        });
      });

      describe("when the asset is USDC", () => {
        beforeEach(() => {
          fromAssetId = "usdc";
          normalizedFromAssetId = "usdc";
          amount = new Decimal(5);
          balanceResponse = { amount: "5000000", asset: { asset_id: "usdc", decimals: 6 } };
          Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(balanceResponse);
        });

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: Asset.toAtomicAmount(amount, fromAssetId).toString(),
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          const wallet = new ethers.Wallet(key.privateKey);
          expect(transaction.sign).toHaveBeenCalledWith(wallet);
        });
      });

      describe("when there is an approve transaction", () => {
        let approveSignedPayload;

        beforeEach(() => {
          approveSignedPayload = "approve_signed_payload";
          approveTransaction = { sign: jest.fn().mockReturnValue(approveSignedPayload) };
          broadcastedTradeModel = {
            ...broadcastedTradeModel,
            approve_transaction: approveTransaction,
          };
        });

        it("should sign the trade transaction with the address key", async () => {
          const trade = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = trade.getTransaction();
          const wallet = new ethers.Wallet(key.privateKey);
          expect(transaction.sign).toHaveBeenCalledWith(wallet);
        });
      });
    });

    describe("when the address cannot sign", () => {
      it("should raise an Error", async () => {
        const newAddress = new DeveloperAddress(VALID_ADDRESS_MODEL, null!);
        await expect(newAddress.createTrade(new Decimal(100), "eth", "usdc")).rejects.toThrow(
          Error,
        );
      });
    });

    describe("when the to fromAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(address.createTrade(new Decimal(100), "XYZ", "eth")).rejects.toThrow(Error);
      });
    });

    describe("when the to toAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(address.createTrade(new Decimal(100), "eth", "XYZ")).rejects.toThrow(Error);
      });
    });

    describe("when the balance is insufficient", () => {
      beforeAll(() => {
        Coinbase.apiClients.address = addressesApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue({ amount: "0" });
      });
      it("should raise an Error", async () => {
        await expect(address.createTrade(new Decimal(100), "eth", "usdc")).rejects.toThrow(Error);
      });
    });
  });
});

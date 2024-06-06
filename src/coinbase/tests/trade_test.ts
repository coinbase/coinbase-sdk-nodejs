import { Decimal } from "decimal.js";
import { ethers } from "ethers";
import {
  Transaction as CoinbaseTransaction,
  Asset as AssetModel,
  Trade as TradeModel,
} from "../../client/api";
import { Transaction } from "../transaction";
import { Coinbase } from "./../coinbase";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER } from "./../constants";
import { Trade } from "./../trade";
import { TransactionStatus } from "./../types";
import { mockReturnValue } from "./utils";

describe("Trade", () => {
  let fromKey,
    networkId,
    walletId,
    addressId,
    fromAmount,
    toAmount,
    ethAmount,
    usdcAmount,
    tradeId,
    unsignedPayload,
    ethAsset,
    usdcAsset,
    transactionModel,
    fromAsset,
    toAsset,
    model,
    tradesApi,
    trade;

  beforeEach(() => {
    fromKey = ethers.Wallet.createRandom();
    networkId = "base-sepolia";
    walletId = ethers.Wallet.createRandom().address;
    addressId = fromKey.address;
    fromAmount = new Decimal(100);
    toAmount = new Decimal(100000);
    ethAmount = fromAmount.div(new Decimal(WEI_PER_ETHER));
    usdcAmount = toAmount.div(new Decimal(ATOMIC_UNITS_PER_USDC));
    tradeId = ethers.Wallet.createRandom().address;
    unsignedPayload =
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e63" +
      "65223a22307830222c22746f223a22307834643965346633663464316138623566346637623166" +
      "356235633762386436623262336231623062222c22676173223a22307835323038222c22676173" +
      "5072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a223078" +
      "3539363832663030222c226d6178466565506572476173223a2230783539363832663030222c22" +
      "76616c7565223a2230783536626337356532643633313030303030222c22696e707574223a22" +
      "3078222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a2230783022" +
      "2c2273223a22307830222c2279506172697479223a22307830222c2268617368223a2230783664" +
      "633334306534643663323633653363396561396135656438646561346332383966613861363966" +
      "3031653635393462333732386230386138323335333433227d";
    ethAsset = { network_id: networkId, asset_id: "eth", decimals: 18 };
    usdcAsset = { network_id: networkId, asset_id: "usdc", decimals: 6 };
    transactionModel = {
      status: "pending",
      from_address_id: addressId,
      unsigned_payload: unsignedPayload,
    } as CoinbaseTransaction;
    fromAsset = ethAsset;
    toAsset = usdcAsset;
    model = {
      network_id: networkId,
      wallet_id: walletId,
      address_id: addressId,
      from_asset: fromAsset,
      to_asset: toAsset,
      from_amount: fromAmount.toString(),
      to_amount: toAmount.toString(),
      trade_id: tradeId,
      transaction: transactionModel,
    } as TradeModel;
    tradesApi = {
      getTrade: jest.fn().mockResolvedValue({ data: model }),
    };
    Coinbase.apiClients.trade = tradesApi;
    trade = new Trade(model);
  });

  describe("constructor", () => {
    it("should initialize a new Trade", () => {
      expect(trade).toBeInstanceOf(Trade);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new Trade(null!)).toThrow("Trade model cannot be empty");
    });
  });

  describe("#getId", () => {
    it("should return the trade ID", () => {
      expect(trade.getId()).toBe(tradeId);
    });
  });

  describe("#getNetworkId", () => {
    it("should return the network ID", () => {
      expect(trade.getNetworkId()).toBe(networkId);
    });
  });

  describe("#getWalletId", () => {
    it("should return the wallet ID", () => {
      expect(trade.getWalletId()).toBe(walletId);
    });
  });

  describe("#getAddressId", () => {
    it("should return the address ID", () => {
      expect(trade.getAddressId()).toBe(addressId);
    });
  });

  describe("#getFromAmount", () => {
    it("should return the amount in whole ETH units", () => {
      expect(trade.getFromAmount()).toEqual(ethAmount);
    });
    it("should return the from amount in the whole units when the from asset is something else", () => {
      model = {
        ...model,
        from_asset: { network_id: networkId, asset_id: "other", decimals: 3 },
        from_amount: new Decimal(500000),
      };
      Coinbase.apiClients.trade!.getTrade = mockReturnValue(model);
      const trade = new Trade(model);
      expect(trade.getFromAmount()).toEqual(new Decimal(500));
    });
  });

  describe("#getFromAssetId", () => {
    it("should return the from asset ID", () => {
      expect(trade.getFromAssetId()).toBe(fromAsset.asset_id);
    });
  });

  describe("#getToAmount", () => {
    it("should return the amount in whole USDC units", () => {
      expect(trade.getToAmount()).toEqual(usdcAmount);
    });
    it("should return the to amount in the whole units when the to asset is something else", () => {
      model = {
        ...model,
        to_asset: { network_id: networkId, asset_id: "other", decimals: 6 },
        to_amount: new Decimal(42000000),
      };
      Coinbase.apiClients.trade!.getTrade = mockReturnValue(model);
      const trade = new Trade(model);
      expect(trade.getToAmount()).toEqual(new Decimal(42));
    });
  });

  describe("#getToAssetId", () => {
    it("should return the to asset ID", () => {
      expect(trade.getToAssetId()).toBe(usdcAsset.asset_id);
    });
  });

  describe("#getTransaction", () => {
    it("should return the Transaction", () => {
      expect(trade.getTransaction()).toBeInstanceOf(Transaction);
    });

    it("should set the from_address_id", () => {
      expect(trade.getTransaction().fromAddressId()).toBe(addressId);
    });
  });

  describe("#getStatus", () => {
    it("should returns the transaction status", () => {
      expect(trade.getStatus()).toBe(TransactionStatus.PENDING);
    });
  });

  describe("#reload", () => {
    let trade, updatedModel;
    beforeEach(() => {
      updatedModel = {
        ...model,
        transaction: {
          ...transactionModel,
          status: "complete",
        },
        to_amount: "500000000",
      } as TradeModel;
      tradesApi.getTrade.mockResolvedValueOnce({ data: updatedModel });

      trade = new Trade(model);
    });
    it("should update the trade transaction", async () => {
      await trade.reload();
      expect(trade.getTransaction().getStatus()).toBe(TransactionStatus.COMPLETE);
      expect(trade.getToAmount()).toEqual(
        new Decimal(500000000).div(new Decimal(ATOMIC_UNITS_PER_USDC)),
      );
    });
    it("should update properties on the trade", async () => {
      expect(trade.getToAmount()).toEqual(usdcAmount);
      await trade.reload();
      expect(trade.getToAmount()).toEqual(
        new Decimal(updatedModel.to_amount).div(new Decimal(ATOMIC_UNITS_PER_USDC)),
      );
    });
  });

  describe("#wait", () => {
    it("should return the completed Trade when the trade is completed", async () => {
      const updatedTransactionModel = {
        ...transactionModel,
        status: "complete",
      } as CoinbaseTransaction;
      const updatedModel = { ...model, transaction: updatedTransactionModel } as TradeModel;
      tradesApi.getTrade
        .mockResolvedValueOnce({ data: model })
        .mockResolvedValueOnce({ data: updatedModel });
      const trade = new Trade(model);
      await trade.wait();
      expect(trade.getStatus()).toBe(TransactionStatus.COMPLETE);
    });

    it("should return the failed Trade", async () => {
      const updatedTransactionModel = {
        ...transactionModel,
        status: "failed",
      } as CoinbaseTransaction;
      const updatedModel = { ...model, transaction: updatedTransactionModel } as TradeModel;
      tradesApi.getTrade
        .mockResolvedValueOnce({ data: model })
        .mockResolvedValueOnce({ data: updatedModel });
      const trade = new Trade(model);
      await trade.wait();
      expect(trade.getStatus()).toBe(TransactionStatus.FAILED);
    });

    it("should raise a timeout error", async () => {
      await expect(
        trade.wait({
          intervalSeconds: 0.2,
          timeoutSeconds: 0.00001,
        }),
      ).rejects.toThrow("Trade timed out");
    });
  });

  describe("#toString", () => {
    it("returns the same value as toString", () => {
      expect(trade.toString()).toEqual(
        `Trade { transfer_id: '${trade.getId()}', network_id: '${trade.getNetworkId()}', address_id: '${trade.getAddressId()}', from_asset_id: '${trade.getFromAssetId()}', to_asset_id: '${trade.getToAssetId()}', from_amount: '${trade.getFromAmount()}', to_amount: '${trade.getToAmount()}', status: '${trade.getStatus()}' }`,
      );
    });
  });
});

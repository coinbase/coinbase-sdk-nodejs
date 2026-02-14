import { Decimal } from "decimal.js";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { Transaction as CoinbaseTransaction, Trade as TradeModel } from "../client/api";
import { Transaction } from "../coinbase/transaction";
import { Coinbase } from "./../coinbase/coinbase";
import { NotSignedError } from "../coinbase/errors";
import { Trade } from "./../coinbase/trade";
import { TransactionStatus } from "./../coinbase/types";
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
    approveTransactionModel,
    fromAsset,
    toAsset,
    model,
    tradesApi,
    trade;

  beforeEach(() => {
    fromKey = ethers.Wallet.createRandom();
    networkId = "base-sepolia";
    walletId = randomUUID();
    addressId = fromKey.address;
    fromAmount = new Decimal(100);
    toAmount = new Decimal(100000);
    ethAsset = { network_id: networkId, asset_id: "eth", decimals: 18 };
    usdcAsset = { network_id: networkId, asset_id: "usdc", decimals: 6 };
    ethAmount = fromAmount.div(new Decimal(Math.pow(10, ethAsset.decimals)));
    usdcAmount = toAmount.div(new Decimal(Math.pow(10, usdcAsset.decimals)));
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
      approve_transaction: approveTransactionModel,
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

  describe("#sign", () => {
    beforeEach(async () => await trade.sign(fromKey));

    it("signs the transfer transaction", async () => {
      expect(trade.getTransaction().isSigned()).toBe(true);
    });

    describe("when there is an approve transaction", () => {
      beforeAll(() => {
        approveTransactionModel = {
          status: "pending",
          from_address_id: addressId,
          unsigned_payload: unsignedPayload,
        } as CoinbaseTransaction;
      });
      afterAll(() => (approveTransactionModel = null));

      it("signs the approve transaction", async () => {
        expect(trade.getApproveTransaction().isSigned()).toBe(true);
      });

      it("signs the transfer transaction", async () => {
        expect(trade.getTransaction().isSigned()).toBe(true);
      });
    });
  });

  describe("#broadcast!", () => {
    let broadcastedTradeModel,
      broadcastedTransactionModel,
      broadcastedApproveTransactionModel,
      signedPayload;

    beforeEach(async () => {
      signedPayload =
        "02f87683014a34808459682f008459682f00825208944d9e4f3f4d1a8b5f4f7b1f5b5c7b8d6b2b3b1b0b89056bc75e2d6310000080c001a07ae1f4655628ac1b226d60a6243aed786a2d36241ffc0f306159674755f4bd9ca050cd207fdfa6944e2b165775e2ca625b474d1eb40fda0f03f4ca9e286eae3cbe";

      broadcastedTransactionModel = {
        ...transactionModel,
        status: "broadcast",
        signed_payload: signedPayload,
      } as unknown as TradeModel;

      broadcastedTradeModel = {
        ...model,
        transaction: broadcastedTransactionModel,
        approve_transaction: broadcastedApproveTransactionModel,
      } as unknown as TradeModel;

      Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);

      model.transaction.signed_payload = signedPayload;

      trade = new Trade(model);
    });

    it("broadcasts the trade with the signed tx payload", async () => {
      await trade.broadcast();

      expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledWith(
        walletId,
        addressId,
        tradeId,
        {
          signed_payload: signedPayload.slice(2),
          approve_transaction_signed_payload: undefined,
        },
      );
    });

    it("returns the broadcasted trade", async () => {
      const broadcastedTrade = await trade.broadcast();

      expect(broadcastedTrade).toBeInstanceOf(Trade);
      expect(broadcastedTrade).toBe(trade);
      expect(trade.getStatus()).toBe(TransactionStatus.BROADCAST);
    });

    describe("when the transaction is not signed", () => {
      beforeEach(async () => {
        model.transaction.signed_payload = undefined;

        trade = new Trade(model);
      });

      it("raises a not signed error", async () => {
        expect(trade.broadcast()).rejects.toThrow(NotSignedError);
      });
    });

    describe("when the trade has an approve transaction", () => {
      let approveSignedPayload;

      beforeEach(() => {
        approveSignedPayload =
          "02f87683014a34808459682f008459682f00825208944d9e4f3f4d1a8b5f4f7b1f5b5c7b8d6b2b3b1b0b89056bc75e2d6310000080c001a07ae1f4655628ac1b226d60a6243aed786a2d36241ffc0f306159674755f4bd9ca050cd207fdfa6944e2b165775e2ca625b474d1eb40fda0f03f4ca9e286eae3cbf"; // Changed last char to 'f'
        approveTransactionModel = {
          status: "pending",
          from_address_id: addressId,
          unsigned_payload: unsignedPayload,
          signed_payload: approveSignedPayload,
        } as CoinbaseTransaction;
        model.approve_transaction = approveTransactionModel;
        trade = new Trade(model);
      });
      afterAll(() => {
        approveTransactionModel = null;
        model.approve_transaction = undefined;
      });

      it("broadcasts the trade with the signed tx and approve tx payloads", async () => {
        await trade.broadcast();

        expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledWith(
          walletId,
          addressId,
          tradeId,
          {
            signed_payload: signedPayload.slice(2),
            approve_transaction_signed_payload: approveSignedPayload.slice(2),
          },
        );

        expect(trade.getStatus()).toBe(TransactionStatus.BROADCAST);
      });

      describe("when the approve transaction is not signed", () => {
        beforeEach(async () => {
          model.approve_transaction.signed_payload = undefined;

          trade = new Trade(model);
        });

        it("raises an error", async () => {
          expect(trade.broadcast()).rejects.toThrow(NotSignedError);
        });
      });
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
        approve_transaction: {
          status: "complete",
          from_address_id: addressId,
          unsigned_payload: unsignedPayload,
        },
      } as TradeModel;
      tradesApi.getTrade.mockResolvedValueOnce({ data: updatedModel });

      trade = new Trade(model);
    });
    it("should update the trade transaction", async () => {
      await trade.reload();
      expect(trade.getTransaction().getStatus()).toBe(TransactionStatus.COMPLETE);
      expect(trade.getToAmount()).toEqual(
        new Decimal(500000000).div(new Decimal(Math.pow(10, usdcAsset.decimals))),
      );
    });
    it("should update properties on the trade", async () => {
      expect(trade.getToAmount()).toEqual(usdcAmount);
      await trade.reload();
      expect(trade.getToAmount()).toEqual(
        new Decimal(updatedModel.to_amount).div(new Decimal(Math.pow(10, usdcAsset.decimals))),
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

    it("should raise a timeout when the request takes longer than the timeout", async () => {
      tradesApi.getTrade.mockResolvedValueOnce(
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: model });
          }, 400);
        }),
      );
      await expect(
        trade.wait({
          intervalSeconds: 0.2,
          timeoutSeconds: 0.00001,
        }),
      ).rejects.toThrow("Trade timed out");
    });
  });

  describe("#toString", () => {
    it("should return the same value as toString", () => {
      expect(trade.toString()).toEqual(
        `Trade { transfer_id: '${trade.getId()}', network_id: '${trade.getNetworkId()}', address_id: '${trade.getAddressId()}', from_asset_id: '${trade.getFromAssetId()}', to_asset_id: '${trade.getToAssetId()}', from_amount: '${trade.getFromAmount()}', to_amount: '${trade.getToAmount()}', status: '${trade.getStatus()}' }`,
      );
    });
  });
});

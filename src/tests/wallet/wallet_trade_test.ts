import { Wallet } from "../../coinbase/wallet";
import { Trade } from "../../coinbase/trade";
import { Coinbase } from "../../coinbase/coinbase";
import {
  mockFn,
  mockReturnValue,
  VALID_WALLET_MODEL,
  tradeApiMock,
  walletsApiMock,
  addressesApiMock,
  assetsApiMock,
  getAssetMock,
  externalAddressApiMock,
  VALID_BALANCE_MODEL,
} from "../utils";
import { TransactionStatusEnum } from "../../client";
import { randomUUID } from "crypto";
import { Decimal } from "decimal.js";

describe("Wallet Trade", () => {
  let wallet: Wallet;
  const walletId = "test-wallet-id";
  const addressId = "test-address-id";
  const networkId = Coinbase.networks.BaseSepolia;

  beforeEach(async () => {
    const mockWalletModel = {
      ...VALID_WALLET_MODEL,
      id: walletId,
      network_id: networkId,
      default_address: { address_id: addressId },
    };
    Coinbase.apiClients.wallet = walletsApiMock;
    Coinbase.apiClients.address = addressesApiMock;
    Coinbase.apiClients.asset = assetsApiMock;
    Coinbase.apiClients.externalAddress = externalAddressApiMock;
    Coinbase.apiClients.wallet.createWallet = mockFn(() => ({ data: mockWalletModel }));
    Coinbase.apiClients.wallet.getWallet = mockFn(() => ({ data: mockWalletModel }));
    Coinbase.apiClients.address.createAddress = mockFn(() => ({ data: mockWalletModel.default_address }));
    Coinbase.apiClients.asset.getAsset = getAssetMock();
    Coinbase.apiClients.externalAddress.getExternalAddressBalance = mockReturnValue(VALID_BALANCE_MODEL);

    // Mock Coinbase.normalizeNetwork
    jest.spyOn(Coinbase, 'normalizeNetwork').mockImplementation((network) => network);

    wallet = await Wallet.create({ networkId });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("#createTrade", () => {
    it("should create a trade from the default address", async () => {
      const mockTradeModel = {
        network_id: networkId,
        wallet_id: walletId,
        address_id: addressId,
        trade_id: randomUUID(),
        from_amount: "0.01",
        transaction: {
          network_id: networkId,
          from_address_id: addressId,
          unsigned_payload: "unsigned_payload",
          status: TransactionStatusEnum.Pending,
        },
      };

      Coinbase.apiClients.trade = tradeApiMock;
      Coinbase.apiClients.trade.createTrade = mockReturnValue(mockTradeModel);

      const trade = await wallet.createTrade({
        amount: 0.01,
        fromAssetId: "eth",
        toAssetId: "usdc",
      });

      expect(trade).toBeInstanceOf(Trade);
      expect(trade.getAddressId()).toBe(addressId);
      expect(trade.getWalletId()).toBe(walletId);
      expect(trade.getId()).toBe(mockTradeModel.trade_id);
      expect(Coinbase.normalizeNetwork).toHaveBeenCalledWith(networkId);
    });

    it("should throw an error if trade creation fails", async () => {
      Coinbase.apiClients.trade = tradeApiMock;
      Coinbase.apiClients.trade.createTrade = mockFn(() => {
        throw new Error("Trade creation failed");
      });

      await expect(
        wallet.createTrade({
          amount: 0.01,
          fromAssetId: "eth",
          toAssetId: "usdc",
        })
      ).rejects.toThrow("Trade creation failed");
      expect(Coinbase.normalizeNetwork).toHaveBeenCalledWith(networkId);
    });

    it("should throw an error if insufficient balance", async () => {
      Coinbase.apiClients.externalAddress.getExternalAddressBalance = mockReturnValue({
        ...VALID_BALANCE_MODEL,
        amount: "0.001",
      });

      await expect(
        wallet.createTrade({
          amount: 1,
          fromAssetId: "eth",
          toAssetId: "usdc",
        })
      ).rejects.toThrow("Insufficient balance");
    });
  });

  describe("#listTrades", () => {
    it("should list trades for the wallet", async () => {
      const mockTradeModels = [
        {
          network_id: Coinbase.networks.BaseSepolia,
          wallet_id: walletId,
          address_id: addressId,
          trade_id: randomUUID(),
          from_amount: "0.01",
          transaction: {
            network_id: Coinbase.networks.BaseSepolia,
            from_address_id: addressId,
            unsigned_payload: "unsigned_payload",
            status: TransactionStatusEnum.Pending,
          },
        },
        {
          network_id: Coinbase.networks.BaseSepolia,
          wallet_id: walletId,
          address_id: addressId,
          trade_id: randomUUID(),
          from_amount: "0.02",
          transaction: {
            network_id: Coinbase.networks.BaseSepolia,
            from_address_id: addressId,
            unsigned_payload: "unsigned_payload",
            status: TransactionStatusEnum.Complete,
          },
        },
      ];

      Coinbase.apiClients.trade = tradeApiMock;
      Coinbase.apiClients.trade.listTrades = mockReturnValue({
        data: mockTradeModels,
        has_more: false,
        next_page: "",
        total_count: mockTradeModels.length,
      });

      const trades = await wallet.listTrades();

      expect(trades).toHaveLength(2);
      trades.forEach((trade, index) => {
        expect(trade).toBeInstanceOf(Trade);
        expect(trade.getAddressId()).toBe(addressId);
        expect(trade.getWalletId()).toBe(walletId);
        expect(trade.getId()).toBe(mockTradeModels[index].trade_id);
      });
    });

    it("should handle pagination when listing trades", async () => {
      const mockTradeModels = Array(3).fill(null).map(() => ({
        network_id: Coinbase.networks.BaseSepolia,
        wallet_id: walletId,
        address_id: addressId,
        trade_id: randomUUID(),
        from_amount: "0.01",
        transaction: {
          network_id: Coinbase.networks.BaseSepolia,
          from_address_id: addressId,
          unsigned_payload: "unsigned_payload",
          status: TransactionStatusEnum.Pending,
        },
      }));

      let callCount = 0;
      Coinbase.apiClients.trade = tradeApiMock;
      Coinbase.apiClients.trade.listTrades = mockFn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              data: mockTradeModels.slice(0, 2),
              has_more: true,
              next_page: "next_page_token",
              total_count: mockTradeModels.length,
            },
          };
        } else {
          return {
            data: {
              data: mockTradeModels.slice(2),
              has_more: false,
              next_page: "",
              total_count: mockTradeModels.length,
            },
          };
        }
      });

      const trades = await wallet.listTrades();

      expect(trades).toHaveLength(3);
      expect(Coinbase.apiClients.trade.listTrades).toHaveBeenCalledTimes(2);
    });

    it("should return an empty array if no trades are found", async () => {
      Coinbase.apiClients.trade = tradeApiMock;
      Coinbase.apiClients.trade.listTrades = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
        total_count: 0,
      });

      const trades = await wallet.listTrades();

      expect(trades).toHaveLength(0);
    });
  });
});
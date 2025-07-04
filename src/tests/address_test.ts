import { Coinbase } from "../coinbase/coinbase";
import { Address, TransactionStatus } from "../index";
import { AddressHistoricalBalanceList, AddressTransactionList, AddressReputation } from "../client";
import {
  VALID_ADDRESS_MODEL,
  mockReturnValue,
  newAddressModel,
  balanceHistoryApiMock,
  transactionHistoryApiMock,
  reputationApiMock,
} from "./utils";
import Decimal from "decimal.js";
import { randomUUID } from "crypto";

describe("Address", () => {
  const newAddress = newAddressModel("", randomUUID(), Coinbase.networks.EthereumHoodi);

  const address = new Address(newAddress.network_id, newAddress.address_id);

  describe(".getNetworkId", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.getNetworkId()).toEqual(VALID_ADDRESS_MODEL.network_id);
    });
  });
  describe(".geId", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.getId()).toEqual(VALID_ADDRESS_MODEL.address_id);
    });
  });
  describe(".toString()", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.toString()).toEqual(
        `Address { addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}' }`,
      );
    });
  });

  describe("#listTransactions", () => {
    beforeEach(() => {
      const mockTransactionsResponse: AddressTransactionList = {
        data: [
          {
            network_id: "base-sepolia",
            from_address_id: "from_address",
            block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
            block_height: "12345",
            unsigned_payload: "",
            status: TransactionStatus.COMPLETE,
          },
          {
            network_id: "base-sepolia",
            from_address_id: "from_address_1",
            block_hash: "block_hash",
            block_height: "12348",
            unsigned_payload: "",
            status: TransactionStatus.FAILED,
          },
        ],
        has_more: true,
        next_page: "pageToken",
      };
      Coinbase.apiClients.transactionHistory = transactionHistoryApiMock;
      Coinbase.apiClients.transactionHistory!.listAddressTransactions =
        mockReturnValue(mockTransactionsResponse);
    });

    it("should return results with param", async () => {
      const paginationResponse = await address.listTransactions({ limit: 2, page: "page" });
      const transactions = paginationResponse.data;
      expect(transactions.length).toEqual(2);
      expect(transactions[0].blockHeight()).toEqual("12345");
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        2,
        "page",
      );
      expect(paginationResponse.nextPage).toEqual("pageToken");
    });

    it("should return results without param", async () => {
      Coinbase.apiClients.transactionHistory!.listAddressTransactions = mockReturnValue({
        data: [
          {
            network_id: "base-sepolia",
            from_address_id: "from_address_1",
            block_hash: "block_hash",
            block_height: "12348",
            unsigned_payload: "",
            status: TransactionStatus.COMPLETE,
          },
        ],
        has_more: false,
        next_page: "",
      });
      const paginationResponse = await address.listTransactions();
      const transactions = paginationResponse.data;
      expect(transactions.length).toEqual(1);
      expect(transactions[0].blockHeight()).toEqual("12348");
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.defaultPageLimit,
        undefined,
      );
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should return empty if no transactions found", async () => {
      Coinbase.apiClients.transactionHistory!.listAddressTransactions = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
      });
      const paginationResponse = await address.listTransactions();
      const transactions = paginationResponse.data;
      expect(transactions.length).toEqual(0);
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.transactionHistory!.listAddressTransactions).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.defaultPageLimit,
        undefined,
      );
      expect(paginationResponse.nextPage).toBe(undefined);
    });
  });

  describe(".listHistoricalBalance", () => {
    beforeEach(() => {
      const mockHistoricalBalanceResponse: AddressHistoricalBalanceList = {
        data: [
          {
            amount: "1000000",
            block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
            block_height: "12345",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 6,
            },
          },
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height: "67890",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
      };
      Coinbase.apiClients.balanceHistory = balanceHistoryApiMock;
      Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance = mockReturnValue(
        mockHistoricalBalanceResponse,
      );
    });

    it("should return results with USDC historical balance with limit", async () => {
      const paginationResponse = await address.listHistoricalBalances(Coinbase.assets.Usdc);
      const historicalBalances = paginationResponse.data;
      expect(historicalBalances.length).toEqual(2);
      expect(historicalBalances[0].amount).toEqual(new Decimal(1));
      expect(historicalBalances[1].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should return results with USDC historical balance with page", async () => {
      const paginationResponse = await address.listHistoricalBalances(Coinbase.assets.Usdc, {
        page: "page_token",
      });
      const historicalBalances = paginationResponse.data;
      expect(historicalBalances.length).toEqual(2);
      expect(historicalBalances[0].amount).toEqual(new Decimal(1));
      expect(historicalBalances[1].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        Coinbase.defaultPageLimit,
        "page_token",
      );
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should return empty if no historical balance found", async () => {
      Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
      });
      const paginationResponse = await address.listHistoricalBalances(Coinbase.assets.Usdc);
      const historicalBalances = paginationResponse.data;
      expect(historicalBalances.length).toEqual(0);
      expect(
        Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should return results with USDC historical balance and next page", async () => {
      Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance = mockReturnValue({
        data: [
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height: "67890",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 6,
            },
          },
        ],
        has_more: true,
        next_page: "next page",
      });

      const paginationResponse = await address.listHistoricalBalances(Coinbase.assets.Usdc, {
        limit: 1,
      });
      const historicalBalances = paginationResponse.data;
      expect(historicalBalances.length).toEqual(1);
      expect(historicalBalances[0].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        1,
        undefined,
      );
      expect(paginationResponse.nextPage).toEqual("next page");
    });
  });

  describe("#reputation", () => {
    beforeEach(() => {
      const mockReputationResponse: AddressReputation = {
        score: 90,
        metadata: {
          activity_period_days: 1,
          bridge_transactions_performed: 1,
          current_active_streak: 1,
          ens_contract_interactions: 2,
          lend_borrow_stake_transactions: 3,
          longest_active_streak: 4,
          smart_contract_deployments: 5,
          token_swaps_performed: 6,
          total_transactions: 7,
          unique_days_active: 8,
        },
      };
      Coinbase.apiClients.addressReputation = reputationApiMock;
      Coinbase.apiClients.addressReputation!.getAddressReputation =
        mockReturnValue(mockReputationResponse);
    });

    it("should return address reputation", async () => {
      const reputation = await address.reputation();
      expect(reputation.score).toEqual(90);
      expect(reputation.metadata).toEqual({
        activity_period_days: 1,
        bridge_transactions_performed: 1,
        current_active_streak: 1,
        ens_contract_interactions: 2,
        lend_borrow_stake_transactions: 3,
        longest_active_streak: 4,
        smart_contract_deployments: 5,
        token_swaps_performed: 6,
        total_transactions: 7,
        unique_days_active: 8,
      });
      expect(Coinbase.apiClients.addressReputation!.getAddressReputation).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.addressReputation!.getAddressReputation).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
      );
    });
  });
});

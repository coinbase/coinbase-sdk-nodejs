import { Address } from "../index";
import { VALID_ADDRESS_MODEL } from "./utils";
import {
  AddressHistoricalBalanceList,
} from "../client";

describe("Address", () => {
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

  describe(".listHistoricalBalance", () => {
    beforeEach(() => {
      const mockHistoricalBalanceResponse: AddressHistoricalBalanceList = {
        data: [
          {
            amount: "1000000",
            block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
            block_height:"12345",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height:"67890",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
      };
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance =
        mockReturnValue(mockHistoricalBalanceResponse);
    });

    it("should return results with USDC historical balance", async () => {
      const [history, nextPage] = await address.listHistoricalBalances(Coinbase.assets.Usdc);
      expect(history.length).toEqual(2);
      expect(history[0].amount).toEqual(new Decimal(1));
      expect(history[1].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
      expect(nextPage).toEqual("")
    });

    it("should return empty if no historical balance found", async () => {
      Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
      });
      const [history, nextPage] = await address.listHistoricalBalances(Coinbase.assets.Usdc);
      expect(history.length).toEqual(0);
      expect(
        Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
      expect(nextPage).toEqual("")
    });

    it("should return results with USDC historical balance and next page", async () => {
      Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance = mockReturnValue({
        data: [
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height:"67890",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
        ],
        has_more: true,
        next_page: "next page",
      });

      const [history, nextPage] = await address.listHistoricalBalances(Coinbase.assets.Usdc, 1);
      expect(history.length).toEqual(1);
      expect(history[0].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        1,
        undefined,
      );
      expect(nextPage).toEqual("next page")
    });
  });

});

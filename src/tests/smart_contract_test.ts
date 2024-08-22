import { Coinbase } from "../coinbase/coinbase";
import { smartContractApiMock, mockFn, mockReturnValue } from "./utils";
import { SmartContract } from "../coinbase/smart_contract";
import { ContractEvent } from "../coinbase/contract_event";

describe("SmartContract", () => {
  const networkId = "ethereum-mainnet";
  const protocolName = "uniswap";
  const contractAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const contractName = "Pool";
  const eventName = "Transfer";
  const fromBlockHeight = 201782330;
  const toBlockHeight = 201782340;

  const CONTRACT_EVENTS_RESPONSE = {
    data: [
      {
        network_id: networkId,
        protocol_name: protocolName,
        contract_name: contractName,
        event_name: eventName,
        sig: "Transfer(address,address,uint256)",
        four_bytes: "0xddf252ad",
        contract_address: contractAddress,
        block_time: "2023-04-01T12:00:00Z",
        block_height: 201782330,
        tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        tx_index: 109,
        event_index: 362,
        data: '{"from":"0x1234...","to":"0x5678...","value":"1000000000000000000"}',
      },
      {
        network_id: networkId,
        protocol_name: protocolName,
        contract_name: contractName,
        event_name: eventName,
        sig: "Transfer(address,address,uint256)",
        four_bytes: "0xddf252ad",
        contract_address: contractAddress,
        block_time: "2023-04-01T12:01:00Z",
        block_height: 201782331,
        tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        tx_index: 110,
        event_index: 363,
        data: '{"from":"0x5678...","to":"0x9012...","value":"2000000000000000000"}',
      },
    ],
    has_more: false,
    next_page: "",
  };

  beforeAll(() => {
    Coinbase.apiClients.smartContract = smartContractApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("#listEvents", () => {
    it("should successfully return contract events", async () => {
      Coinbase.apiClients.smartContract!.listContractEvents =
        mockReturnValue(CONTRACT_EVENTS_RESPONSE);
      const response = await SmartContract.listEvents(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
      );
      expect(response).toBeInstanceOf(Array<ContractEvent>);
      expect(response.length).toEqual(2);
      expect(Coinbase.apiClients.smartContract!.listContractEvents).toHaveBeenCalledWith(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        undefined,
      );
    });

    it("should successfully return contract events for multiple pages", async () => {
      const pages = ["abc", "def"];
      Coinbase.apiClients.smartContract!.listContractEvents = mockFn(() => {
        CONTRACT_EVENTS_RESPONSE.next_page = pages.shift() as string;
        CONTRACT_EVENTS_RESPONSE.has_more = !!CONTRACT_EVENTS_RESPONSE.next_page;
        return { data: CONTRACT_EVENTS_RESPONSE };
      });
      const response = await SmartContract.listEvents(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
      );
      expect(response).toBeInstanceOf(Array<ContractEvent>);
      expect(response.length).toEqual(6);
      expect(Coinbase.apiClients.smartContract!.listContractEvents).toHaveBeenCalledWith(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        undefined,
      );
    });

    it("should handle API errors gracefully", async () => {
      Coinbase.apiClients.smartContract!.listContractEvents = jest
        .fn()
        .mockRejectedValue(new Error("API Error"));

      await expect(
        SmartContract.listEvents(
          networkId,
          protocolName,
          contractAddress,
          contractName,
          eventName,
          fromBlockHeight,
          toBlockHeight,
        ),
      ).rejects.toThrow("API Error");
    });

    it("should handle empty response", async () => {
      Coinbase.apiClients.smartContract!.listContractEvents = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
      });
      const response = await SmartContract.listEvents(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
      );
      expect(response).toBeInstanceOf(Array<ContractEvent>);
      expect(response.length).toEqual(0);
    });
  });
});

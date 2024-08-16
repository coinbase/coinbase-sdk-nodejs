import { Coinbase } from "../coinbase/coinbase";
import { smartContractApiMock, mockFn, mockReturnValue } from "./utils";
import { SmartContract, ContractEvent } from "../coinbase/smart_contract";

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
        contractAddress,
        protocolName,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        100,
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
        contractAddress,
        protocolName,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        100,
        undefined,
      );
    });
  });
});

describe("ContractEvent", () => {
  const eventData = {
    network_id: "ethereum-mainnet",
    protocol_name: "uniswap",
    contract_name: "Pool",
    event_name: "Transfer",
    sig: "Transfer(address,address,uint256)",
    four_bytes: "0xddf252ad",
    contract_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    block_time: "2023-04-01T12:00:00Z",
    block_height: 201782330,
    tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    tx_index: 109,
    event_index: 362,
    data: '{"from":"0x1234...","to":"0x5678...","value":"1000000000000000000"}',
  };

  describe(".blockTime", () => {
    it("should return the correct block time", () => {
      const event = new ContractEvent(eventData);
      const blockTime = event.blockTime();
      expect(blockTime).toEqual(new Date("2023-04-01T12:00:00Z"));
    });
  });

  describe(".toString", () => {
    it("should return the string representation of a contract event", () => {
      const event = new ContractEvent(eventData);
      const eventStr = event.toString();
      expect(eventStr).toEqual(
        "ContractEvent { networkId: 'ethereum-mainnet' protocolName: 'uniswap' contractName: 'Pool' eventName: 'Transfer' contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' blockHeight: 201782330 txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' }",
      );
    });
  });

  describe(".contractAddress", () => {
    it("should return the contract address of the ContractEvent", () => {
      const event = new ContractEvent(eventData);
      const contractAddress = event.contractAddress();
      expect(contractAddress).toEqual("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    });
  });
});

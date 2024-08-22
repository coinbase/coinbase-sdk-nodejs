import { ContractEvent } from "../coinbase/contract_event";

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

  describe(".networkId", () => {
    it("should return the correct network ID", () => {
      const event = new ContractEvent(eventData);
      expect(event.networkId()).toEqual("ethereum-mainnet");
    });
  });

  describe(".protocolName", () => {
    it("should return the correct protocol name", () => {
      const event = new ContractEvent(eventData);
      expect(event.protocolName()).toEqual("uniswap");
    });
  });

  describe(".contractName", () => {
    it("should return the correct contract name", () => {
      const event = new ContractEvent(eventData);
      expect(event.contractName()).toEqual("Pool");
    });
  });

  describe(".eventName", () => {
    it("should return the correct event name", () => {
      const event = new ContractEvent(eventData);
      expect(event.eventName()).toEqual("Transfer");
    });
  });

  describe(".sig", () => {
    it("should return the correct signature", () => {
      const event = new ContractEvent(eventData);
      expect(event.sig()).toEqual("Transfer(address,address,uint256)");
    });
  });

  describe(".fourBytes", () => {
    it("should return the correct four bytes", () => {
      const event = new ContractEvent(eventData);
      expect(event.fourBytes()).toEqual("0xddf252ad");
    });
  });

  describe(".contractAddress", () => {
    it("should return the correct contract address", () => {
      const event = new ContractEvent(eventData);
      expect(event.contractAddress()).toEqual("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    });
  });

  describe(".blockTime", () => {
    it("should return the correct block time", () => {
      const event = new ContractEvent(eventData);
      expect(event.blockTime()).toEqual(new Date("2023-04-01T12:00:00Z"));
    });
  });

  describe(".blockHeight", () => {
    it("should return the correct block height", () => {
      const event = new ContractEvent(eventData);
      expect(event.blockHeight()).toEqual(201782330);
    });
  });

  describe(".txHash", () => {
    it("should return the correct transaction hash", () => {
      const event = new ContractEvent(eventData);
      expect(event.txHash()).toEqual(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );
    });
  });

  describe(".txIndex", () => {
    it("should return the correct transaction index", () => {
      const event = new ContractEvent(eventData);
      expect(event.txIndex()).toEqual(109);
    });
  });

  describe(".eventIndex", () => {
    it("should return the correct event index", () => {
      const event = new ContractEvent(eventData);
      expect(event.eventIndex()).toEqual(362);
    });
  });

  describe(".data", () => {
    it("should return the correct event data", () => {
      const event = new ContractEvent(eventData);
      expect(event.data()).toEqual(
        '{"from":"0x1234...","to":"0x5678...","value":"1000000000000000000"}',
      );
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
});

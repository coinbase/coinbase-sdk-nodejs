import { Coinbase } from "../coinbase/coinbase";
import {
  smartContractApiMock,
  mockFn,
  mockReturnValue,
  VALID_CONTRACT_INVOCATION_MODEL,
  VALID_SMART_CONTRACT_ERC20_MODEL,
  mockReturnRejectedValue,
  contractEventApiMock,
  ERC20_NAME,
  ERC20_TOTAL_SUPPLY,
  ERC20_SYMBOL,
  VALID_SMART_CONTRACT_ERC721_MODEL,
  ERC721_NAME,
  ERC721_SYMBOL,
  ERC721_BASE_URI,
} from "./utils";
import { SmartContract } from "../coinbase/smart_contract";
import { ContractEvent } from "../coinbase/contract_event";
import { SmartContract as SmartContractModel } from "../client/api";
import { Transaction } from "../coinbase/transaction";
import { ethers } from "ethers";
import { TransactionStatus } from "../coinbase/types";
import { APIError } from "../coinbase/api_error";
import { AxiosError } from "axios";
import { TimeoutError } from "../coinbase/errors";

describe("SmartContract", () => {
  let erc20Model: SmartContractModel = VALID_SMART_CONTRACT_ERC20_MODEL;
  let erc721Model: SmartContractModel = VALID_SMART_CONTRACT_ERC721_MODEL;
  let erc20SmartContract: SmartContract = SmartContract.fromModel(erc20Model);
  let erc721SmartContract: SmartContract = SmartContract.fromModel(erc721Model);
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("initializes a new SmartContract", () => {
      expect(erc20SmartContract).toBeInstanceOf(SmartContract);
    });

    it("raises an error when the smartContract model is empty", () => {
      expect(() => SmartContract.fromModel(undefined!)).toThrow(
        "SmartContract model cannot be empty",
      );
    });
  });

  describe("#getId", () => {
    it("returns the smart contract ID", () => {
      expect(erc20SmartContract.getId()).toEqual(
        VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id,
      );
    });
  });

  describe("#getNetworkId", () => {
    it("returns the smart contract network ID", () => {
      expect(erc20SmartContract.getNetworkId()).toEqual(
        VALID_SMART_CONTRACT_ERC20_MODEL.network_id,
      );
    });
  });

  describe("#getContractAddress", () => {
    it("returns the smart contract contract address", () => {
      expect(erc20SmartContract.getContractAddress()).toEqual(
        VALID_SMART_CONTRACT_ERC20_MODEL.contract_address,
      );
    });
  });

  describe("#getDeployerAddress", () => {
    it("returns the smart contract deployer address", () => {
      expect(erc20SmartContract.getDeployerAddress()).toEqual(
        VALID_SMART_CONTRACT_ERC20_MODEL.deployer_address,
      );
    });
  });

  describe("#getType", () => {
    it("returns the smart contract type", () => {
      expect(erc20SmartContract.getType()).toEqual(VALID_SMART_CONTRACT_ERC20_MODEL.type);
    });
  });

  describe("#getOptions", () => {
    it("returns the smart contract options", () => {
      expect(erc20SmartContract.getOptions()).toEqual({
        name: ERC20_NAME,
        symbol: ERC20_SYMBOL,
        totalSupply: ERC20_TOTAL_SUPPLY.toString(),
      });
    });

    it("returns the smart contract options for ERC721", () => {
      expect(erc721SmartContract.getOptions()).toEqual({
        name: ERC721_NAME,
        symbol: ERC721_SYMBOL,
        baseURI: ERC721_BASE_URI,
      });
    });
  });

  describe("#getAbi", () => {
    it("returns the smart contract ABI", () => {
      expect(erc20SmartContract.getAbi()).toEqual(JSON.parse(VALID_SMART_CONTRACT_ERC20_MODEL.abi));
    });
  });

  describe("#getTransaction", () => {
    it("returns the smart contract transaction", () => {
      expect(erc20SmartContract.getTransaction()).toEqual(
        new Transaction(VALID_SMART_CONTRACT_ERC20_MODEL.transaction),
      );
    });
  });

  describe("#sign", () => {
    let signingKey: any = ethers.Wallet.createRandom();

    it("return the signature", async () => {
      const smartContract = SmartContract.fromModel({
        ...VALID_SMART_CONTRACT_ERC20_MODEL,
        transaction: {
          ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
          signed_payload: "0xsignedHash",
        },
      });

      const signature = await smartContract.sign(signingKey);

      expect(signature).toEqual(smartContract.getTransaction()!.getSignature()!);
    });
  });

  describe("#broadcast", () => {
    let signedPayload = "0xsignedHash";

    beforeEach(() => {
      Coinbase.apiClients.smartContract = smartContractApiMock;

      // Ensure signed payload is present.
      erc20SmartContract = SmartContract.fromModel({
        ...VALID_SMART_CONTRACT_ERC20_MODEL,
        transaction: {
          ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
          signed_payload: signedPayload,
        },
      });
    });

    describe("when it was successful", () => {
      let broadcastedSmartContract: SmartContract;

      beforeEach(async () => {
        Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
          ...VALID_SMART_CONTRACT_ERC20_MODEL,
          transaction: {
            ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
            signed_payload: signedPayload,
            status: TransactionStatus.BROADCAST,
          },
        });

        broadcastedSmartContract = await erc20SmartContract.broadcast();
      });

      it("returns the broadcasted smart contract", async () => {
        expect(broadcastedSmartContract).toBeInstanceOf(SmartContract);
        expect(broadcastedSmartContract.getTransaction().getStatus()).toEqual(
          TransactionStatus.BROADCAST,
        );
      });

      it("broadcasts the smart contract", async () => {
        expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
          erc20SmartContract.getWalletId(),
          erc20SmartContract.getDeployerAddress(),
          erc20SmartContract.getId(),
          {
            signed_payload: signedPayload.slice(2),
          },
        );

        expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the transaction is not signed", () => {
      beforeEach(() => {
        erc20SmartContract = SmartContract.fromModel(VALID_SMART_CONTRACT_ERC20_MODEL);
      });

      it("throws an error", async () => {
        expect(erc20SmartContract.broadcast()).rejects.toThrow(
          "Cannot broadcast unsigned SmartContract deployment",
        );
      });
    });

    describe("when broadcasting fails", () => {
      beforeEach(() => {
        Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnRejectedValue(
          new APIError({
            response: {
              status: 400,
              data: {
                code: "invalid_signed_payload",
                message: "failed to broadcast contract invocation: invalid signed payload",
              },
            },
          } as AxiosError),
        );
      });

      it("throws an error", async () => {
        expect(erc20SmartContract.broadcast()).rejects.toThrow(APIError);
      });
    });
  });

  describe("#wait", () => {
    describe("when the transaction is complete", () => {
      beforeEach(() => {
        Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue({
          ...VALID_SMART_CONTRACT_ERC20_MODEL,
          transaction: {
            ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
            status: TransactionStatus.COMPLETE,
          },
        });
      });

      it("successfully waits and returns", async () => {
        const completedSmartContract = await erc20SmartContract.wait();
        expect(completedSmartContract).toBeInstanceOf(SmartContract);
        expect(completedSmartContract.getTransaction().getStatus()).toEqual(
          TransactionStatus.COMPLETE,
        );
      });
    });

    describe("when the transaction is failed", () => {
      beforeEach(() => {
        Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue({
          ...VALID_SMART_CONTRACT_ERC20_MODEL,
          transaction: {
            ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
            status: TransactionStatus.FAILED,
          },
        });
      });

      it("successfully waits and returns a failed invocation", async () => {
        const completedSmartContract = await erc20SmartContract.wait();
        expect(completedSmartContract).toBeInstanceOf(SmartContract);
        expect(completedSmartContract.getTransaction().getStatus()).toEqual(
          TransactionStatus.FAILED,
        );
      });
    });

    describe("when the transaction is pending", () => {
      beforeEach(() => {
        Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue({
          ...VALID_SMART_CONTRACT_ERC20_MODEL,
          transaction: {
            ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
            status: TransactionStatus.PENDING,
          },
        });
      });

      it("throws a timeout error", async () => {
        expect(
          erc20SmartContract.wait({ timeoutSeconds: 0.05, intervalSeconds: 0.05 }),
        ).rejects.toThrow(new TimeoutError("SmartContract deployment timed out"));
      });
    });
  });

  describe("#reload", () => {
    it("returns the updated smart contract", async () => {
      Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue({
        ...VALID_SMART_CONTRACT_ERC20_MODEL,
        transaction: {
          ...VALID_SMART_CONTRACT_ERC20_MODEL.transaction!,
          status: TransactionStatus.COMPLETE,
        },
      });
      await erc20SmartContract.reload();
      expect(erc20SmartContract.getTransaction().getStatus()).toEqual(TransactionStatus.COMPLETE);
      expect(Coinbase.apiClients.smartContract!.getSmartContract).toHaveBeenCalledTimes(1);
    });
  });

  describe("#toString", () => {
    it("returns the same value as toString", () => {
      expect(erc20SmartContract.toString()).toEqual(
        `SmartContract{id: '${erc20SmartContract.getId()}', networkId: '${erc20SmartContract.getNetworkId()}', ` +
          `contractAddress: '${erc20SmartContract.getContractAddress()}', deployerAddress: '${erc20SmartContract.getDeployerAddress()}', ` +
          `type: '${erc20SmartContract.getType()}'}`,
      );
    });
  });
});

describe("SmartContract.listEvents", () => {
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
    Coinbase.apiClients.contractEvent = contractEventApiMock;
  });

  it("should successfully return contract events", async () => {
    Coinbase.apiClients.contractEvent!.listContractEvents =
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
    expect(Coinbase.apiClients.contractEvent!.listContractEvents).toHaveBeenCalledWith(
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
    Coinbase.apiClients.contractEvent!.listContractEvents = mockFn(() => {
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
    expect(Coinbase.apiClients.contractEvent!.listContractEvents).toHaveBeenCalledWith(
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
    Coinbase.apiClients.contractEvent!.listContractEvents = jest
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
    Coinbase.apiClients.contractEvent!.listContractEvents = mockReturnValue({
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

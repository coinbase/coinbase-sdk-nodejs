import { ethers } from "ethers";
import { AxiosError } from "axios";
import { Decimal } from "decimal.js";
import {
  ContractInvocation as ContractInvocationModel,
  TransactionStatusEnum,
} from "../client/api";
import { TransactionStatus } from "../coinbase/types";
import { ContractInvocation } from "../coinbase/contract_invocation";
import { Transaction } from "../coinbase/transaction";
import { Coinbase } from "../coinbase/coinbase";
import {
  VALID_CONTRACT_INVOCATION_MODEL,
  VALID_SIGNED_CONTRACT_INVOCATION_MODEL,
  mockReturnValue,
  mockReturnRejectedValue,
  contractInvocationApiMock,
  MINT_NFT_ARGS,
  MINT_NFT_ABI,
} from "./utils";

import { TimeoutError } from "../coinbase/errors";
import { APIError } from "../coinbase/api_error";

describe("Contract Invocation Class", () => {
  let contractInvocationModel: ContractInvocationModel;
  let contractInvocation: ContractInvocation;

  beforeEach(() => {
    Coinbase.apiClients.contractInvocation = contractInvocationApiMock;

    contractInvocationModel = VALID_CONTRACT_INVOCATION_MODEL;
    contractInvocation = ContractInvocation.fromModel(contractInvocationModel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("initializes a new ContractInvocation", () => {
      expect(contractInvocation).toBeInstanceOf(ContractInvocation);
    });

    it("raises an error when the contractInvocation model is empty", () => {
      expect(() => ContractInvocation.fromModel(undefined!)).toThrow(
        "ContractInvocation model cannot be empty",
      );
    });
  });

  describe("#getId", () => {
    it("returns the contract invocation ID", () => {
      expect(contractInvocation.getId()).toEqual(
        VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
      );
    });
  });

  describe("#getNetworkId", () => {
    it("returns the network ID", () => {
      expect(contractInvocation.getNetworkId()).toEqual(VALID_CONTRACT_INVOCATION_MODEL.network_id);
    });
  });

  describe("#getWalletId", () => {
    it("returns the wallet ID", () => {
      expect(contractInvocation.getWalletId()).toEqual(VALID_CONTRACT_INVOCATION_MODEL.wallet_id);
    });
  });

  describe("#getFromAddressId", () => {
    it("returns the source address ID", () => {
      expect(contractInvocation.getFromAddressId()).toEqual(
        VALID_CONTRACT_INVOCATION_MODEL.address_id,
      );
    });
  });

  describe("#getContractAddressId", () => {
    it("returns the contract address ID", () => {
      expect(contractInvocation.getContractAddressId()).toEqual(
        VALID_CONTRACT_INVOCATION_MODEL.contract_address,
      );
    });
  });

  describe("#getMethod", () => {
    it("return the conrtact invocation's method", () => {
      expect(contractInvocation.getMethod()).toEqual(VALID_CONTRACT_INVOCATION_MODEL.method);
    });
  });

  describe("#getArgs", () => {
    it("returns the parsed arguments", () => {
      expect(contractInvocation.getArgs()).toEqual(MINT_NFT_ARGS);
    });
  });

  describe("#getAbi", () => {
    it("returns the parsed ABI", () => {
      expect(contractInvocation.getAbi()).toEqual(MINT_NFT_ABI);
    });
  });

  describe("#getAmount", () => {
    it("returns the amount", () => {
      expect(contractInvocation.getAmount()).toEqual(new Decimal(0));
    });
  });

  describe("#getTransactionHash", () => {
    describe("when the transaction has a hash", () => {
      let transactionHash = "0xtransactionHash";

      beforeEach(() => {
        contractInvocation = ContractInvocation.fromModel({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            transaction_hash: transactionHash,
          },
        });
      });

      it("returns the transaction hash", () => {
        expect(contractInvocation.getTransactionHash()).toEqual(transactionHash);
      });
    });

    describe("when the transaction does not have a hash", () => {
      it("returns undefined", () => {
        expect(contractInvocation.getTransactionHash()).toBeUndefined();
      });
    });
  });

  describe("#getTransactionLink", () => {
    describe("when the transaction has a transaction link", () => {
      let transactionLink = `https://sepolia.basescan.org/tx/0xtransactionHash`;

      beforeEach(() => {
        contractInvocation = ContractInvocation.fromModel({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            transaction_link: transactionLink,
          },
        });
      });

      it("returns the transaction link", () => {
        expect(contractInvocation.getTransactionLink()).toEqual(transactionLink);
      });
    });

    describe("when the transaction does not have a link", () => {
      it("returns undefined", () => {
        expect(contractInvocation.getTransactionLink()).toBeUndefined();
      });
    });
  });

  describe("#getTransaction", () => {
    it("returns the transaction", () => {
      expect(contractInvocation.getTransaction()).toBeInstanceOf(Transaction);
    });
  });

  describe("#getRawTransaction", () => {
    it("returns the ContractInvocation raw transaction", () => {
      expect(contractInvocation.getRawTransaction()).toBeInstanceOf(ethers.Transaction);
    });
  });

  describe("#getStatus", () => {
    let txStatus;

    beforeEach(() => {
      contractInvocationModel = {
        ...VALID_CONTRACT_INVOCATION_MODEL,
        transaction: {
          ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
          status: txStatus,
        },
      };

      contractInvocation = ContractInvocation.fromModel(contractInvocationModel);
    });

    [
      TransactionStatus.PENDING,
      TransactionStatus.BROADCAST,
      TransactionStatus.COMPLETE,
      TransactionStatus.FAILED,
    ].forEach(status => {
      describe(`when the transaction has status ${status}`, () => {
        beforeAll(() => (txStatus = status));
        afterAll(() => (txStatus = undefined));

        it("returns the correct status", async () => {
          expect(contractInvocation.getStatus()).toEqual(status);
        });
      });
    });
  });

  describe("#broadcast", () => {
    let signedPayload = "0xsignedHash";

    beforeEach(() => {
      // Ensure signed payload is present.
      contractInvocation = ContractInvocation.fromModel({
        ...VALID_CONTRACT_INVOCATION_MODEL,
        transaction: {
          ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
          signed_payload: signedPayload,
        },
      });
    });

    describe("when it was successful", () => {
      let broadcastedInvocation;

      beforeEach(async () => {
        Coinbase.apiClients.contractInvocation!.broadcastContractInvocation = mockReturnValue({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            signed_payload: signedPayload,
            status: TransactionStatus.BROADCAST,
          },
        });

        broadcastedInvocation = await contractInvocation.broadcast();
      });

      it("returns the broadcasted contract invocation", async () => {
        expect(broadcastedInvocation).toBeInstanceOf(ContractInvocation);
        expect(broadcastedInvocation.getStatus()).toEqual(TransactionStatus.BROADCAST);
      });

      it("broadcasts the contract invocation", async () => {
        expect(
          Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
        ).toHaveBeenCalledWith(
          contractInvocation.getWalletId(),
          contractInvocation.getFromAddressId(),
          contractInvocation.getId(),
          {
            signed_payload: signedPayload.slice(2),
          },
        );

        expect(
          Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe("when the transaction is not signed", () => {
      beforeEach(() => {
        contractInvocation = ContractInvocation.fromModel(VALID_CONTRACT_INVOCATION_MODEL);
      });

      it("throws an error", async () => {
        expect(contractInvocation.broadcast()).rejects.toThrow(
          "Cannot broadcast unsigned ContractInvocation",
        );
      });
    });

    describe("when broadcasting fails", () => {
      beforeEach(() => {
        Coinbase.apiClients.contractInvocation!.broadcastContractInvocation =
          mockReturnRejectedValue(
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
        expect(contractInvocation.broadcast()).rejects.toThrow(APIError);
      });
    });
  });

  describe("#sign", () => {
    let signingKey: any = ethers.Wallet.createRandom();

    it("return the signature", async () => {
      const contractInvocation = ContractInvocation.fromModel({
        ...VALID_CONTRACT_INVOCATION_MODEL,
        transaction: {
          ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
          signed_payload: "0xsignedHash",
        },
      });

      const signature = await contractInvocation.sign(signingKey);

      expect(signature).toEqual(contractInvocation.getTransaction()!.getSignature()!);
    });
  });

  describe("#wait", () => {
    describe("when the transaction is complete", () => {
      beforeEach(() => {
        Coinbase.apiClients.contractInvocation!.getContractInvocation = mockReturnValue({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            status: TransactionStatusEnum.Complete,
          },
        });
      });

      it("successfully waits and returns", async () => {
        const completedContractInvocation = await contractInvocation.wait();
        expect(completedContractInvocation).toBeInstanceOf(ContractInvocation);
        expect(completedContractInvocation.getStatus()).toEqual(TransactionStatus.COMPLETE);
      });
    });

    describe("when the transaction is failed", () => {
      beforeEach(() => {
        Coinbase.apiClients.contractInvocation!.getContractInvocation = mockReturnValue({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            status: TransactionStatusEnum.Failed,
          },
          status: TransactionStatus.FAILED,
        });
      });

      it("successfully waits and returns a failed invocation", async () => {
        const completedContractInvocation = await contractInvocation.wait();
        expect(completedContractInvocation).toBeInstanceOf(ContractInvocation);
        expect(completedContractInvocation.getStatus()).toEqual(TransactionStatus.FAILED);
      });
    });

    describe("when the transaction is pending", () => {
      beforeEach(() => {
        Coinbase.apiClients.contractInvocation!.getContractInvocation = mockReturnValue({
          ...VALID_CONTRACT_INVOCATION_MODEL,
          transaction: {
            ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
            status: TransactionStatusEnum.Pending,
          },
        });
      });

      it("throws a timeout error", async () => {
        expect(
          contractInvocation.wait({ timeoutSeconds: 0.05, intervalSeconds: 0.05 }),
        ).rejects.toThrow(new TimeoutError("ContractInvocation timed out"));
      });
    });
  });

  describe("#reload", () => {
    it("returns the updated contract invocation", async () => {
      Coinbase.apiClients.contractInvocation!.getContractInvocation = mockReturnValue({
        ...VALID_CONTRACT_INVOCATION_MODEL,
        transaction: {
          ...VALID_CONTRACT_INVOCATION_MODEL.transaction!,
          status: TransactionStatusEnum.Complete,
        },
      });
      await contractInvocation.reload();
      expect(contractInvocation.getStatus()).toEqual(TransactionStatus.COMPLETE);
      expect(Coinbase.apiClients.contractInvocation!.getContractInvocation).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe("#toString", () => {
    it("returns the same value as toString", () => {
      expect(contractInvocation.toString()).toEqual(
        `ContractInvocation{contractInvocationId: '${contractInvocation.getId()}', networkId: '${contractInvocation.getNetworkId()}', ` +
          `fromAddressId: '${contractInvocation.getFromAddressId()}', contractAddressId: '${contractInvocation.getContractAddressId()}', ` +
          `method: '${contractInvocation.getMethod()}', args: '${contractInvocation.getArgs()}', transactionHash: '${contractInvocation.getTransactionHash()}', ` +
          `transactionLink: '${contractInvocation.getTransactionLink()}', status: '${contractInvocation.getStatus()!}'}`,
      );
    });
  });
});

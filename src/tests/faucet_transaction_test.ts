import { FaucetTransaction } from "../coinbase/faucet_transaction";
import { TransactionStatusEnum } from "../client/api";
import { Coinbase } from "../coinbase/coinbase";
import {
  VALID_FAUCET_TRANSACTION_MODEL,
  mockReturnValue,
  mockReturnRejectedValue,
  externalAddressApiMock,
} from "./utils";

describe("FaucetTransaction tests", () => {
  let faucetTransaction: FaucetTransaction;
  let model;
  const {
    transaction_hash: txHash,
    transaction_link: txLink,
    network_id: networkId,
    to_address_id: toAddressId,
  } = VALID_FAUCET_TRANSACTION_MODEL.transaction!;

  beforeEach(() => {
    Coinbase.apiClients.externalAddress = externalAddressApiMock;

    faucetTransaction = new FaucetTransaction(VALID_FAUCET_TRANSACTION_MODEL);
  });

  describe("constructor", () => {
    it("initializes a FaucetTransaction", () => {
      expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    });

    it("throws an Error if model is not provided", () => {
      expect(() => new FaucetTransaction(null!)).toThrow(`FaucetTransaction model cannot be empty`);
    });
  });

  describe("#getTransactionHash", () => {
    it("returns the transaction hash", () => {
      expect(faucetTransaction.getTransactionHash()).toBe(txHash);
    });
  });

  describe("#getTransactionLink", () => {
    it("returns the transaction link", () => {
      expect(faucetTransaction.getTransactionLink()).toBe(txLink);
    });
  });

  describe("#getNetworkId", () => {
    it("returns the network ID", () => {
      expect(faucetTransaction.getNetworkId()).toBe(networkId);
    });
  });

  describe("#getAddressId", () => {
    it("returns the transaction to address ID", () => {
      expect(faucetTransaction.getAddressId()).toBe(toAddressId);
    });
  });

  describe("#reload", () => {
    let txStatus;
    let reloadedFaucetTx: FaucetTransaction;

    beforeEach(async () => {
      Coinbase.apiClients.externalAddress!.getFaucetTransaction = mockReturnValue({
        ...VALID_FAUCET_TRANSACTION_MODEL,
        transaction: {
          ...VALID_FAUCET_TRANSACTION_MODEL.transaction!,
          status: txStatus,
        },
      });

      reloadedFaucetTx = await faucetTransaction.reload();
    });

    [
      TransactionStatusEnum.Pending,
      TransactionStatusEnum.Complete,
      TransactionStatusEnum.Failed,
    ].forEach(status => {
      describe(`when the transaction is ${status}`, () => {
        beforeAll(() => (txStatus = status));

        it("returns a FaucetTransaction", () => {
          expect(reloadedFaucetTx).toBeInstanceOf(FaucetTransaction);
        });

        it("updates the FaucetTransaction", () => {
          expect(faucetTransaction.getStatus()).toBe(status);
        });

        it("calls the API to get the FaucetTransaction", () => {
          expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledWith(
            networkId,
            toAddressId,
            txHash,
          );
          expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledTimes(
            1,
          );
        });
      });
    });
  });

  describe("#wait", () => {
    describe("when the transaction eventually completes", () => {
      beforeEach(() => {
        Coinbase.apiClients.externalAddress!.getFaucetTransaction = jest
          .fn()
          .mockResolvedValueOnce({ data: VALID_FAUCET_TRANSACTION_MODEL }) // Pending
          .mockResolvedValueOnce({
            data: {
              ...VALID_FAUCET_TRANSACTION_MODEL,
              transaction: {
                ...VALID_FAUCET_TRANSACTION_MODEL.transaction!,
                status: TransactionStatusEnum.Complete,
              },
            },
          });
      });

      it("returns the completed FaucetTransaction", async () => {
        const completedFaucetTx = await faucetTransaction.wait();

        expect(completedFaucetTx).toBeInstanceOf(FaucetTransaction);
        expect(completedFaucetTx.getStatus()).toBe(TransactionStatusEnum.Complete);
      });

      it("calls the API to get the FaucetTransaction", async () => {
        await faucetTransaction.wait();

        expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledWith(
          networkId,
          toAddressId,
          txHash,
        );
        expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledTimes(2);
      });
    });

    describe("when the transaction eventually fails", () => {
      beforeEach(() => {
        Coinbase.apiClients.externalAddress!.getFaucetTransaction = jest
          .fn()
          .mockResolvedValueOnce({ data: VALID_FAUCET_TRANSACTION_MODEL }) // Pending
          .mockResolvedValueOnce({
            data: {
              ...VALID_FAUCET_TRANSACTION_MODEL,
              transaction: {
                ...VALID_FAUCET_TRANSACTION_MODEL.transaction!,
                status: TransactionStatusEnum.Failed,
              },
            },
          });
      });

      it("returns the failed FaucetTransaction", async () => {
        const failedFaucetTx = await faucetTransaction.wait();

        expect(failedFaucetTx).toBeInstanceOf(FaucetTransaction);
        expect(failedFaucetTx.getStatus()).toBe(TransactionStatusEnum.Failed);
      });

      it("calls the API to get the FaucetTransaction", async () => {
        await faucetTransaction.wait();

        expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledWith(
          networkId,
          toAddressId,
          txHash,
        );
        expect(Coinbase.apiClients.externalAddress!.getFaucetTransaction).toHaveBeenCalledTimes(2);
      });
    });

    describe("when the transaction times out", () => {
      beforeEach(() => {
        // Returns pending for every request.
        Coinbase.apiClients.externalAddress!.getFaucetTransaction = jest
          .fn()
          .mockResolvedValueOnce({ data: VALID_FAUCET_TRANSACTION_MODEL }); // Pending
      });

      it("throws a TimeoutError", async () => {
        expect(
          faucetTransaction.wait({ timeoutSeconds: 0.001, intervalSeconds: 0.001 }),
        ).rejects.toThrow(new Error("FaucetTransaction timed out"));
      });
    });
  });
});

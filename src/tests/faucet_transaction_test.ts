import { FaucetTransaction } from "../coinbase/faucet_transaction";
import {
  VALID_FAUCET_TRANSACTION_MODEL,
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
    faucetTransaction = new FaucetTransaction(VALID_FAUCET_TRANSACTION_MODEL);
  });

  describe("constructor", () => {
    it("initializes a FaucetTransaction", () => {
      expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    });

    it("throws an Error if model is not provided", () => {
      expect(() => new FaucetTransaction(null!))
        .toThrow(`FaucetTransaction model cannot be empty`);
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
});

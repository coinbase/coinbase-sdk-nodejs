import { FaucetTransaction } from "../coinbase/faucet_transaction";

describe("FaucetTransaction tests", () => {
  it("should create a new FaucetTransaction instance and return the transaction hash", () => {
    const faucetTransaction = new FaucetTransaction({
      transaction_hash: "abc",
    });

    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe("abc");
    expect(faucetTransaction.getTransactionLink()).toBe("https://sepolia.basescan.org/tx/abc");
    expect(faucetTransaction.toString()).toBe(
      "Coinbase::FaucetTransaction{transaction_hash: 'abc', transaction_link: 'https://sepolia.basescan.org/tx/abc'}",
    );
  });

  it("should throw an InternalError if model is not provided", () => {
    expect(() => new FaucetTransaction(null!)).toThrow(`FaucetTransaction model cannot be empty`);
  });
});

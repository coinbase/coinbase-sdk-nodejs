// test/index.test.ts
import * as index from "../index";

describe("Index file exports", () => {
  it("should export all modules correctly", () => {
    expect(index).toBeDefined();
    expect(index).toHaveProperty("Address");
    expect(index).toHaveProperty("APIError");
    expect(index).toHaveProperty("Asset");
    expect(index).toHaveProperty("Balance");
    expect(index).toHaveProperty("BalanceMap");
    expect(index).toHaveProperty("Coinbase");
    expect(index).toHaveProperty("ContractEvent");
    expect(index).toHaveProperty("ContractInvocation");
    expect(index).toHaveProperty("ExternalAddress");
    expect(index).toHaveProperty("FaucetTransaction");
    expect(index).toHaveProperty("GWEI_DECIMALS");
    expect(index).toHaveProperty("HistoricalBalance");
    expect(index).toHaveProperty("InvalidAPIKeyFormatError");
    expect(index).toHaveProperty("PayloadSignature");
    expect(index).toHaveProperty("ServerSigner");
    expect(index).toHaveProperty("SmartContract");
    expect(index).toHaveProperty("SponsoredSendStatus");
    expect(index).toHaveProperty("StakeOptionsMode");
    expect(index).toHaveProperty("StakingBalance");
    expect(index).toHaveProperty("StakingOperation");
    expect(index).toHaveProperty("StakingReward");
    expect(index).toHaveProperty("Trade");
    expect(index).toHaveProperty("Transaction");
    expect(index).toHaveProperty("TransactionStatus");
    expect(index).toHaveProperty("Transfer");
    expect(index).toHaveProperty("TransferStatus");
    expect(index).toHaveProperty("Validator");
    expect(index).toHaveProperty("Wallet");
    expect(index).toHaveProperty("WalletAddress");
    expect(index).toHaveProperty("Webhook");
    expect(index).toHaveProperty("CryptoAmount");
    expect(index).toHaveProperty("FiatAmount");
    expect(index).toHaveProperty("FundOperation");
    expect(index).toHaveProperty("FundQuote");
  });
});

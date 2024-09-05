import { ethers } from "ethers";
import { Transaction as TransactionModel, EthereumTransaction } from "../client/api";
import { Transaction } from "./../coinbase/transaction";
import { TransactionStatus } from "../coinbase/types";

describe("Transaction", () => {
  let fromKey;
  let fromAddressId;
  let toAddressId;
  let unsignedPayload;
  let signedPayload;
  let transactionHash;
  let model;
  let broadcastedModel;
  let transaction;
  let ethereumContent;
  let onchainModel;
  let blockHash;
  let blockHeight;

  beforeEach(() => {
    fromKey = ethers.Wallet.createRandom();
    fromAddressId = fromKey.address;
    toAddressId = "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b";
    unsignedPayload =
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e63" +
      "65223a22307830222c22746f223a22307834643965346633663464316138623566346637623166" +
      "356235633762386436623262336231623062222c22676173223a22307835323038222c22676173" +
      "5072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a223078" +
      "3539363832663030222c226d6178466565506572476173223a2230783539363832663030222c22" +
      "76616c7565223a2230783536626337356532643633313030303030222c22696e707574223a22" +
      "3078222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a2230783022" +
      "2c2273223a22307830222c2279506172697479223a22307830222c2268617368223a2230783664" +
      "633334306534643663323633653363396561396135656438646561346332383966613861363966" +
      "3031653635393462333732386230386138323335333433227d";
    signedPayload =
      "02f87683014a34808459682f008459682f00825208944d9e4f3f4d1a8b5f4f7b1f5b5c7b8d6b2b3b1b0b89056bc75e2d6310000080c001a07ae1f4655628ac1b226d60a6243aed786a2d36241ffc0f306159674755f4bd9ca050cd207fdfa6944e2b165775e2ca625b474d1eb40fda0f03f4ca9e286eae3cbe";

    transactionHash = "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11";

    blockHash = "0x0728750d458976fd010a2e15cef69ec71c6fccb3377f38a71b70ab551ab22688";
    blockHeight = "18779006";
    ethereumContent = {
      priority_fee_per_gas: 1000,
    } as EthereumTransaction;

    model = {
      status: "pending",
      from_address_id: fromAddressId,
      unsigned_payload: unsignedPayload,
    } as TransactionModel;

    broadcastedModel = {
      status: "broadcast",
      from_address_id: fromAddressId,
      unsigned_payload: unsignedPayload,
      signed_payload: signedPayload,
      transaction_hash: transactionHash,
      transaction_link: `https://sepolia.basescan.org/tx/${transactionHash}`,
    } as TransactionModel;

    onchainModel = {
      status: "complete",
      from_address_id: fromAddressId,
      unsigned_payload: "",
      block_hash: blockHash,
      block_height: blockHeight,
      content: ethereumContent,
    } as TransactionModel;

    transaction = new Transaction(model);
  });

  describe("constructor", () => {
    it("initializes a new Transaction", () => {
      expect(transaction).toBeInstanceOf(Transaction);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new Transaction(null!)).toThrow("Invalid model type");
    });
  });

  describe("#getUnsignedPayload", () => {
    it("returns the unsigned payload", () => {
      expect(transaction.getUnsignedPayload()).toEqual(unsignedPayload);
    });
  });

  describe("#getSignedPayload", () => {
    it("should return undefined when the transaction has not been broadcast on chain", () => {
      expect(transaction.getSignedPayload()).toBeUndefined();
    });

    it("should return the signed payload when the transaction has been broadcast on chain", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.getSignedPayload()).toEqual(signedPayload);
    });
  });

  describe("#getTransactionHash", () => {
    it("should return undefined when the transaction has not been broadcast on chain", () => {
      expect(transaction.getTransactionHash()).toBeUndefined();
    });

    it("should return the transaction hash when the transaction has been broadcast on chain", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.getTransactionHash()).toEqual(transactionHash);
    });
  });

  describe("#getRawTransaction", () => {
    let raw: ethers.Transaction, rawPayload;

    beforeEach(() => {
      raw = transaction.rawTransaction();
      rawPayload = JSON.parse(Buffer.from(unsignedPayload, "hex").toString());
    });
    it("should return the raw transaction", () => {
      expect(raw).toBeInstanceOf(ethers.Transaction);
    });

    it("should return the correct value", () => {
      expect(raw.value).toEqual(BigInt(rawPayload.value));
    });

    it("should return the chain ID", () => {
      expect(raw.chainId).toEqual(BigInt(rawPayload.chainId));
    });

    it("should return the correct destination address", () => {
      expect(raw.to?.toUpperCase()).toEqual(toAddressId.toUpperCase());
    });

    it("should return the correct nonce", () => {
      expect(raw.nonce).toEqual(0);
    });

    it("should return the correct gas limit", () => {
      expect(raw.gasLimit).toEqual(BigInt(rawPayload.gas));
    });

    it("should return the correct max priority fee per gas", () => {
      expect(raw?.maxPriorityFeePerGas).toEqual(BigInt(rawPayload.maxPriorityFeePerGas));
    });

    it("should return the correct max fee per gas", () => {
      expect(raw.maxFeePerGas).toEqual(BigInt(rawPayload.maxFeePerGas));
    });

    it("should return the correct input", () => {
      expect(raw.data).toEqual(rawPayload.input);
    });

    it("should return the same raw transaction when called multiple times", () => {
      expect(raw).toEqual(transaction.rawTransaction());
    });
  });

  describe("#getTransactionLink", () => {
    it("should return the transaction link when the transaction hash is available", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.getTransactionLink()).toEqual(
        `https://sepolia.basescan.org/tx/${transactionHash}`,
      );
    });
  });

  describe("#sign", () => {
    let signature: string;

    beforeEach(async () => {
      signature = await transaction.sign(fromKey);
    });

    it("should return a string when the transaction is signed", async () => {
      expect(typeof signature).toBe("string");
    });

    it("signs the raw transaction", async () => {
      expect(signature).not.toBeNull();
    });

    it("returns a hex representation of the signed raw transaction", async () => {
      expect(signature).not.toBeNull();
      expect(signature.length).toBeGreaterThan(0);
    });

    it("sets the signed boolean", () => {
      expect(transaction.isSigned()).toEqual(true);
    });

    it("sets the signed payload", () => {
      expect(transaction.getSignedPayload().slice(2)).toEqual(signature);
    });
  });

  describe("#getStatus", () => {
    it("should return undefined when the transaction has not been initiated with a model", async () => {
      model.status = "";
      const transaction = new Transaction(model);
      expect(transaction.getStatus()).toBeUndefined();
    });

    it("should return a pending status", () => {
      model.status = TransactionStatus.PENDING;
      const transaction = new Transaction(model);
      expect(transaction.getStatus()).toEqual("pending");
    });

    it("should return a broadcast status", () => {
      model.status = TransactionStatus.BROADCAST;
      const transaction = new Transaction(model);
      expect(transaction.getStatus()).toEqual("broadcast");
    });

    it("should return a complete status", () => {
      model.status = TransactionStatus.COMPLETE;
      const transaction = new Transaction(model);
      expect(transaction.getStatus()).toEqual("complete");
    });

    it("should return a failed status", () => {
      model.status = TransactionStatus.FAILED;
      const transaction = new Transaction(model);
      expect(transaction.getStatus()).toEqual("failed");
    });
  });

  describe("#blockHash", () => {
    it("returns the block hash", () => {
      const transaction = new Transaction(onchainModel);
      expect(transaction.blockHash()).toEqual(blockHash);
    });

    it("returns undefined when block hash is undefined", () => {
      expect(transaction.blockHash()).toBeUndefined;
    });
  });

  describe("#blockHeight", () => {
    it("returns the block height", () => {
      const transaction = new Transaction(onchainModel);
      expect(transaction.blockHeight()).toEqual(blockHeight);
    });

    it("returns undefined when block height is undefined", () => {
      expect(transaction.blockHeight()).toBeUndefined;
    });
  });

  describe("#content", () => {
    it("returns the ethereum transaction", () => {
      const transaction = new Transaction(onchainModel);
      expect(transaction.content()).toEqual(ethereumContent);
    });

    it("returns undefined when content is undefined", () => {
      expect(transaction.content()).toBeUndefined;
    });
  });

  describe("#fromAddressId", () => {
    it("should return the from address ID", () => {
      expect(transaction.fromAddressId()).toEqual(fromAddressId);
    });
  });

  describe("#isTerminalState", () => {
    it("should not be in a terminal state", () => {
      expect(transaction.isTerminalState()).toEqual(false);
    });

    it("should be in a terminal state", () => {
      model.status = TransactionStatus.COMPLETE;
      const transaction = new Transaction(model);
      expect(transaction.isTerminalState()).toEqual(true);
    });

    it("should not be in a terminal state with an undefined status", () => {
      model.status = "foo-status";
      const transaction = new Transaction(model);
      expect(transaction.isTerminalState()).toEqual(false);
    });
  });

  describe("#toString", () => {
    it("includes transaction details", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.toString()).toContain(transaction.getStatus());
    });

    it("returns the same value as toString", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.toString()).toEqual(
        `Transaction { transactionHash: '${transaction.getTransactionHash()}', status: '${transaction.getStatus()}', unsignedPayload: '${transaction.getUnsignedPayload()}', signedPayload: ${transaction.getSignedPayload()}, transactionLink: ${transaction.getTransactionLink()} }`,
      );
    });

    it("should include the transaction hash when the transaction has been broadcast on chain", () => {
      const transaction = new Transaction(broadcastedModel);
      expect(transaction.toString()).toContain(transaction.getTransactionHash());
    });
  });
});

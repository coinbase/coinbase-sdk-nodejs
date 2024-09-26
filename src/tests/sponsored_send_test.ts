import { ethers } from "ethers";
import { SponsoredSend as SponsoredSendModel } from "../client/api";
import { SponsoredSend } from "./../coinbase/sponsored_send";
import { SponsoredSendStatus } from "../coinbase/types";

describe("SponsoredSend", () => {
  let fromKey;
  let toAddressId;
  let rawTypedData;
  let typedDataHash;
  let signature;
  let transactionHash;
  let transactionLink;
  let model;
  let signedModel;
  let completedModel;
  let sponsoredSend;

  beforeEach(() => {
    fromKey = ethers.Wallet.createRandom();
    toAddressId = "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b";
    typedDataHash = "0x7523946e17c0b8090ee18c84d6f9a8d63bab4d579a6507f0998dde0791891823";
    signature = "0x7523946e17c0b8090ee18c84d6f9a8d63bab4d579a6507f0998dde0791891823";
    transactionHash = "0xdea671372a8fff080950d09ad5994145a661c8e95a9216ef34772a19191b5690";
    transactionLink = `https://sepolia.basescan.org/tx/${transactionHash}`;

    model = {
      status: "pending",
      to_address_id: toAddressId,
      typed_data_hash: typedDataHash,
    } as SponsoredSendModel;

    signedModel = {
      status: "signed",
      to_address_id: toAddressId,
      typed_data_hash: typedDataHash,
      signature: signature,
    } as SponsoredSendModel;

    completedModel = {
      status: "complete",
      to_address_id: toAddressId,
      typed_data_hash: typedDataHash,
      signature: signature,
      transaction_hash: transactionHash,
      transaction_link: transactionLink,
    } as SponsoredSendModel;

    sponsoredSend = new SponsoredSend(model);
  });

  describe("constructor", () => {
    it("initializes a new SponsoredSend", () => {
      expect(sponsoredSend).toBeInstanceOf(SponsoredSend);
    });

    it("should raise an error when initialized with a model of a different type", () => {
      expect(() => new SponsoredSend(null!)).toThrow("Invalid model type");
    });
  });

  describe("#getTypedDataHash", () => {
    it("returns the typed data hash", () => {
      expect(sponsoredSend.getTypedDataHash()).toEqual(typedDataHash);
    });
  });

  describe("#getSignature", () => {
    it("should return undefined when the SponsoredSend has not been signed", () => {
      expect(sponsoredSend.getSignature()).toBeUndefined();
    });

    it("should return the signature when the SponsoredSend has been signed", () => {
      const sponsoredSend = new SponsoredSend(signedModel);
      expect(sponsoredSend.getSignature()).toEqual(signature);
    });
  });

  describe("#getTransactionHash", () => {
    it("should return undefined when the SponsoredSend has not been broadcast on chain", () => {
      expect(sponsoredSend.getTransactionHash()).toBeUndefined();
    });

    it("should return the transaction hash when the SponsoredSend has been broadcast on chain", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.getTransactionHash()).toEqual(transactionHash);
    });
  });

  describe("#getTransactionLink", () => {
    it("should return the transaction link when the transaction hash is available", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.getTransactionLink()).toEqual(
        `https://sepolia.basescan.org/tx/${transactionHash}`,
      );
    });
  });

  describe("#sign", () => {
    let signature: string;

    beforeEach(async () => {
      signature = await sponsoredSend.sign(fromKey);
    });

    it("should return a string when the SponsoredSend is signed", async () => {
      expect(typeof signature).toBe("string");
    });

    it("signs the raw typed data hash", async () => {
      expect(signature).not.toBeNull();
    });

    it("returns a hex representation of the signed typed data hash", async () => {
      expect(signature).not.toBeNull();
      expect(signature.length).toBeGreaterThan(0);
    });

    it("sets the signed boolean", () => {
      expect(sponsoredSend.isSigned()).toEqual(true);
    });

    it("sets the signature", () => {
      expect(sponsoredSend.getSignature()).toEqual(signature);
    });
  });

  describe("#getStatus", () => {
    it("should return undefined when the SponsoredSend has not been initiated with a model", async () => {
      model.status = "";
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.getStatus()).toBeUndefined();
    });

    it("should return a pending status", () => {
      model.status = SponsoredSendStatus.PENDING;
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.getStatus()).toEqual("pending");
    });

    it("should return a submitted status", () => {
      model.status = SponsoredSendStatus.SUBMITTED;
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.getStatus()).toEqual("submitted");
    });

    it("should return a complete status", () => {
      model.status = SponsoredSendStatus.COMPLETE;
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.getStatus()).toEqual("complete");
    });

    it("should return a failed status", () => {
      model.status = SponsoredSendStatus.FAILED;
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.getStatus()).toEqual("failed");
    });
  });

  describe("#isTerminalState", () => {
    it("should not be in a terminal state", () => {
      expect(sponsoredSend.isTerminalState()).toEqual(false);
    });

    it("should be in a terminal state", () => {
      model.status = SponsoredSendStatus.COMPLETE;
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.isTerminalState()).toEqual(true);
    });

    it("should not be in a terminal state with an undefined status", () => {
      model.status = "foo-status";
      const sponsoredSend = new SponsoredSend(model);
      expect(sponsoredSend.isTerminalState()).toEqual(false);
    });
  });

  describe("#toString", () => {
    it("includes SponsoredSend details", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.toString()).toContain(sponsoredSend.getStatus());
    });

    it("returns the same value as toString", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.toString()).toEqual(
        `SponsoredSend { transactionHash: '${sponsoredSend.getTransactionHash()}', status: '${sponsoredSend.getStatus()}', typedDataHash: '${sponsoredSend.getTypedDataHash()}', signature: ${sponsoredSend.getSignature()}, transactionLink: ${sponsoredSend.getTransactionLink()} }`,
      );
    });

    it("should include the transaction hash when the SponsoredSend has been broadcast on chain", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.toString()).toContain(sponsoredSend.getTransactionHash());
    });
  });

  describe("#toJSON", () => {
    it("returns the same value as toJSON", () => {
      const sponsoredSend = new SponsoredSend(completedModel);
      expect(sponsoredSend.toJSON()).toEqual({
        transactionHash: sponsoredSend.getTransactionHash(),
        status: sponsoredSend.getStatus(),
        typedDataHash: sponsoredSend.getTypedDataHash(),
        signature: sponsoredSend.getSignature(),
        transactionLink: sponsoredSend.getTransactionLink(),
      });
    });
  });
});

import { PayloadSignature } from "../coinbase/payload_signature";
import {
  VALID_PAYLOAD_SIGNATURE_MODEL,
  VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL,
  addressesApiMock,
  mockReturnValue,
  mockReturnRejectedValue,
} from "./utils";
import { PayloadSignatureStatusEnum } from "../client";
import { Coinbase } from "../coinbase/coinbase";
import { APIError } from "../coinbase/api_error";

describe("PayloadSignature", () => {
  beforeEach(() => { });

  describe("constructor", () => {
    it("initializes a new PayloadSignature", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature).toBeInstanceOf(PayloadSignature);
    });

    it("should raise an error when initialized with an invalid model", () => {
      expect(() => new PayloadSignature(null!)).toThrow("Invalid model type");
    });
  });

  describe("#getId", () => {
    it("should return the Payload Signature ID", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getId()).toEqual(VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id);
    });
  });

  describe("#getWalletId", () => {
    it("should return the Wallet ID", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getWalletId()).toEqual(VALID_PAYLOAD_SIGNATURE_MODEL.wallet_id);
    });
  });

  describe("#getAddressId", () => {
    it("should return the Address ID", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getAddressId()).toEqual(VALID_PAYLOAD_SIGNATURE_MODEL.address_id);
    });
  });

  describe("#getUnsignedPayload", () => {
    it("should return the Unsigned Payload", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getUnsignedPayload()).toEqual(
        VALID_PAYLOAD_SIGNATURE_MODEL.unsigned_payload,
      );
    });
  });

  describe("#getSignature", () => {
    it("should return undefined when the PayloadSignature has not been signed", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getSignature()).toBeUndefined();
    });

    it("should return the signature when the PayloadSignature has been signed", () => {
      const payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getSignature()).toEqual(
        VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL.signature,
      );
    });
  });

  describe("#getStatus", () => {
    it("should return a pending status", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getStatus()).toEqual("pending");
    });

    it("should return a signed status", () => {
      const payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.getStatus()).toEqual("signed");
    });

    it("should return a failed status", () => {
      const payloadSignature = new PayloadSignature({
        ...VALID_PAYLOAD_SIGNATURE_MODEL,
        status: PayloadSignatureStatusEnum.Failed,
      });
      expect(payloadSignature.getStatus()).toEqual("failed");
    });
  });

  describe("#isTerminalState", () => {
    it("should not be in a terminal state", () => {
      const payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.isTerminalState()).toEqual(false);
    });

    it("should be in a terminal state", () => {
      const payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.isTerminalState()).toEqual(true);
    });
  });

  describe("#wait", () => {
    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update Payload Signature model", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnValue(
        VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL,
      );

      let payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      await payloadSignature.wait();

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        VALID_PAYLOAD_SIGNATURE_MODEL.wallet_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.address_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
      expect(payloadSignature.getStatus()).toEqual("signed");
      expect(payloadSignature.isTerminalState()).toEqual(true);
    });

    it("should throw an APIError when the API call to get payload signature fails", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnRejectedValue(
        new APIError("Failed to get payload signature"),
      );

      let payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);

      expect(async () => {
        await payloadSignature.reload();
      }).rejects.toThrow(Error);

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        VALID_PAYLOAD_SIGNATURE_MODEL.wallet_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.address_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
    });
  });

  describe("#reload", () => {
    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update Payload Signature model", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnValue(
        VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL,
      );

      let payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);
      await payloadSignature.reload();

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        VALID_PAYLOAD_SIGNATURE_MODEL.wallet_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.address_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
      expect(payloadSignature.getStatus()).toEqual("signed");
    });

    it("should throw an APIError when the API call to get payload signature fails", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnRejectedValue(
        new APIError("Failed to get payload signature"),
      );

      let payloadSignature = new PayloadSignature(VALID_PAYLOAD_SIGNATURE_MODEL);

      expect(async () => {
        await payloadSignature.reload();
      }).rejects.toThrow(Error);

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        VALID_PAYLOAD_SIGNATURE_MODEL.wallet_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.address_id,
        VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
    });
  });

  describe("#toString", () => {
    let payloadSignature: PayloadSignature;

    beforeAll(() => {
      payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
    });

    it("includes PayloadSignature details", () => {
      expect(payloadSignature.toString()).toContain(payloadSignature.getStatus());
    });

    it("returns the same value as toString", () => {
      const payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.toString()).toEqual(
        `PayloadSignature { status: '${payloadSignature.getStatus()}', unsignedPayload: '${payloadSignature.getUnsignedPayload()}', signature: ${payloadSignature.getSignature()} }`,
      );
    });
  });

  describe("#toJSON", () => {
    let payloadSignature: PayloadSignature;

    beforeAll(() => {
      payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
    });

    it("returns the same value as toJSON", () => {
      const payloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
      expect(payloadSignature.toJSON()).toEqual({
        id: payloadSignature.getId(),
        addressId: payloadSignature.getAddressId(),
        walletId: payloadSignature.getWalletId(),
        status: payloadSignature.getStatus(),
        unsignedPayload: payloadSignature.getUnsignedPayload(),
        signature: payloadSignature.getSignature(),
      });
    });
  });
});

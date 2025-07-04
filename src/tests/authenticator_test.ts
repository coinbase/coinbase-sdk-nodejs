import { AxiosHeaders } from "axios";
import { CoinbaseAuthenticator } from "../coinbase/authenticator";
import { importPKCS8, SignJWT, importJWK } from "jose";
import { InvalidAPIKeyFormatError } from "../coinbase/errors";
import * as crypto from "crypto";

const VALID_CONFIG = {
  method: "GET",
  url: "https://api.cdp.coinbase.com/platform/v1/networks/base-mainnet",
  headers: {} as AxiosHeaders,
};

describe("Authenticator tests", () => {
  const filePath = "./config/test_api_key.json";
  const keys = require(filePath);
  let authenticator: CoinbaseAuthenticator;
  let source: string;
  let sourceVersion: string | undefined;
  let privateKey: string;
  let apiKey: string;

  beforeEach(() => {
    // Use a dummy PEM string for testing (its contents are not really parsed because we override extractPemKey below)
    privateKey = "-----BEGIN EC PRIVATE KEY-----\nMOCK_KEY\n-----END EC PRIVATE KEY-----";
    apiKey = "mockApiKey";
    source = "mockSource";
    sourceVersion = undefined;

    jest.spyOn(console, "log").mockImplementation(() => {});
    // Use the key from config for instantiation (could be a real valid key)
    authenticator = new CoinbaseAuthenticator(keys.name, keys.privateKey, source, sourceVersion);
  });

  it("should raise InvalidConfiguration error for invalid config", async () => {
    const invalidConfig = {
      method: "GET",
      url: "", // Invalid URL
      headers: {} as AxiosHeaders,
    };
    await expect(authenticator.authenticateRequest(invalidConfig)).rejects.toThrow();
  });

  it("should return a valid signature", async () => {
    const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
    const token = config.headers?.Authorization as string;
    expect(token).toContain("Bearer ");
    expect(token.length).toBeGreaterThan(100);
  });

  it("includes a correlation context header", async () => {
    const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
    const correlationContext = config.headers["Correlation-Context"] as string;
    expect(correlationContext).toContain(",sdk_language=typescript,source=mockSource");
    expect(correlationContext).not.toContain("source_version");
  });

  describe("when a source version is provided", () => {
    beforeAll(() => {
      sourceVersion = "1.0.0";
    });
    afterAll(() => {
      sourceVersion = undefined;
    });

    it("includes the source version in the correlation context", async () => {
      const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
      const correlationContext = config.headers["Correlation-Context"] as string;
      expect(correlationContext).toContain(
        "sdk_version=0.25.0,sdk_language=typescript,source=mockSource",
      );
    });
  });

  it("invalid pem key should raise an InvalidAPIKeyFormat error", async () => {
    // Passing an invalid PEM that does not match the expected format.
    const invalidAuthenticator = new CoinbaseAuthenticator(
      "test-key",
      "-----BEGIN EC KEY-----\n", // intentionally invalid
      source,
    );
    await expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow();
  });

  describe("#buildJWT", () => {
    let instance: CoinbaseAuthenticator;

    beforeEach(() => {
      instance = new CoinbaseAuthenticator(apiKey, privateKey, source);
      // Override private methods using a type cast.
      (instance as any).extractPemKey = jest
        .fn()
        .mockReturnValue("-----BEGIN EC PRIVATE KEY-----\nMOCK_KEY\n-----END EC PRIVATE KEY-----");
      (instance as any).nonce = jest.fn().mockReturnValue("mockNonce");
    });

    test("should throw error if private key cannot be parsed", async () => {
      // Pass an invalid PEM so that createPrivateKey fails naturally.
      const invalidInstance = new CoinbaseAuthenticator(
        apiKey,
        "-----BEGIN EC PRIVATE KEY-----\nINVALID\n-----END EC PRIVATE KEY-----",
        source,
      );
      await expect(invalidInstance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
      await expect(invalidInstance.buildJWT("https://example.com")).rejects.toThrow(
        "Could not convert the EC private key to PKCS8 format",
      );
    });

    test("should throw error if key import fails", async () => {
      // Spy on importPKCS8 to simulate a key import failure.
      const joseModule = require("jose");
      const spy = jest.spyOn(joseModule, "importPKCS8").mockImplementation(async () => {
        throw new Error("Import error");
      });
      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        "Could not convert the EC private key to PKCS8 format",
      );
      spy.mockRestore();
    });

    test("should throw error if JWT signing fails", async () => {
      const joseModule = require("jose");
      jest.spyOn(joseModule, "importPKCS8").mockResolvedValue({} as any);
      const spy = jest
        .spyOn(SignJWT.prototype, "sign")
        .mockRejectedValue(new Error("Signing error"));
      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        "Could not convert the EC private key to PKCS8 format",
      );
      spy.mockRestore();
    });
  });
});

describe("Authenticator tests for Edwards key", () => {
  const filePath = "./config/test_ed25519_api_key.json";
  const keys = require(filePath);
  let authenticator: CoinbaseAuthenticator;
  let source: string;
  let sourceVersion: string | undefined;
  let privateKey: string;
  let apiKey: string;

  beforeEach(() => {
    // Use the Edwards key from config (a valid Base64-encoded 64-byte string)
    privateKey = keys.privateKey;
    apiKey = keys.name;
    source = "mockSource";
    sourceVersion = undefined;
    jest.spyOn(console, "log").mockImplementation(() => {});
    authenticator = new CoinbaseAuthenticator(apiKey, privateKey, source, sourceVersion);
  });

  it("should raise InvalidConfiguration error for invalid config", async () => {
    const invalidConfig = {
      method: "GET",
      url: "",
      headers: {} as AxiosHeaders,
    };
    await expect(authenticator.authenticateRequest(invalidConfig)).rejects.toThrow();
  });

  describe("With a valid JWT and correct correlation context header", () => {
    beforeEach(() => {
      // Override SignJWT.prototype.sign to simulate successful signing.
      jest.spyOn(SignJWT.prototype, "sign").mockResolvedValue("dummy.jwt.token");
      (authenticator as any).nonce = jest.fn().mockReturnValue("mockNonce");
    });
    afterEach(() => {
      (SignJWT.prototype.sign as jest.Mock).mockRestore();
    });

    it("should return a valid signature", async () => {
      const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
      const token = config.headers?.Authorization as string;
      expect(token).toContain("Bearer ");
      expect(token.length).toBeGreaterThan(10);
    });

    it("includes a correlation context header", async () => {
      const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
      const correlationContext = config.headers["Correlation-Context"] as string;
      expect(correlationContext).toContain(",sdk_language=typescript,source=mockSource");
      expect(correlationContext).not.toContain("source_version");
    });

    describe("when a source version is provided", () => {
      beforeAll(() => {
        sourceVersion = "1.0.0";
      });
      afterAll(() => {
        sourceVersion = undefined;
      });

      it("includes the source version in the correlation context", async () => {
        const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
        const correlationContext = config.headers["Correlation-Context"] as string;
        expect(correlationContext).toContain(
          "sdk_version=0.25.0,sdk_language=typescript,source=mockSource",
        );
      });
    });

    it("should raise an InvalidAPIKeyFormat error if Edwards key length is not 64 bytes", async () => {
      const invalidEdKey = privateKey.slice(0, -4);
      const invalidAuthenticator = new CoinbaseAuthenticator(apiKey, invalidEdKey, source);
      await expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
    });

    describe("#buildJWT", () => {
      let instance: CoinbaseAuthenticator;

      beforeEach(() => {
        instance = new CoinbaseAuthenticator(apiKey, privateKey, source);
        (instance as any).nonce = jest.fn().mockReturnValue("mockNonce");
      });

      test("should throw error if Edwards key length is not 64 bytes", async () => {
        const invalidEdKey = privateKey.slice(0, -4);
        instance = new CoinbaseAuthenticator(apiKey, invalidEdKey, source);
        await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
          InvalidAPIKeyFormatError,
        );
      });

      test("should return a valid JWT when building with Edwards key", async () => {
        const jwt = await instance.buildJWT("https://example.com", "GET");
        expect(jwt).toContain(".");
        const parts = jwt.split(".");
        expect(parts.length).toBe(3);
      });
    });
  });
});

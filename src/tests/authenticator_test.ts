import { AxiosHeaders } from "axios";
import { CoinbaseAuthenticator } from "../coinbase/authenticator";
import { JWK, JWS } from "node-jose";
import { InvalidAPIKeyFormatError } from "../coinbase/errors";

const VALID_CONFIG = {
  method: "GET",
  url: "https://api.cdp.coinbase.com/platform/v1/networks/base-mainnet",
  headers: {} as AxiosHeaders,
};

describe("Authenticator tests", () => {
  const filePath = "./config/test_api_key.json";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const keys = require(filePath);
  let authenticator;
  let source;
  let sourceVersion;
  let privateKey;
  let apiKey;

  beforeEach(() => {
    privateKey = "mockPrivateKey";
    apiKey = "mockApiKey";
    source = "mockSource";

    jest.spyOn(console, "log").mockImplementation(() => {});

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
    expect(token?.length).toBeGreaterThan(100);
  });

  it("includes a correlation context header", async () => {
    const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
    const correlationContext = config.headers["Correlation-Context"] as string;
    expect(correlationContext).toContain(",sdk_language=typescript,source=mockSource");
    expect(correlationContext).not.toContain("source_version");
  });

  describe("when a source version is provided", () => {
    beforeAll(() => (sourceVersion = "1.0.0"));
    afterAll(() => (sourceVersion = undefined));

    it("includes the source version in the correlation context", async () => {
      const config = await authenticator.authenticateRequest(VALID_CONFIG, true);
      const correlationContext = config.headers["Correlation-Context"] as string;
      expect(correlationContext).toContain(",source_version=1.0.0");
    });
  });

  it("invalid pem key should raise an InvalidAPIKeyFormat error", async () => {
    const invalidAuthenticator = new CoinbaseAuthenticator(
      "test-key",
      "-----BEGIN EC KEY-----\n",
      source,
    );

    expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow();
  });

  describe("#buildJWT", () => {
    let instance;

    beforeEach(() => {
      instance = new CoinbaseAuthenticator(apiKey, privateKey, source);
      instance.extractPemKey = jest.fn().mockReturnValue("mockPemPrivateKey");
      instance.nonce = jest.fn().mockReturnValue("mockNonce");
    });

    test("should throw error if private key cannot be parsed", async () => {
      jest.spyOn(JWK, "asKey").mockRejectedValue(new Error("Invalid key"));

      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        "Could not parse the private key",
      );
    });

    test("should throw error if key type is not EC", async () => {
      const mockKey = { kty: "RSA" };
      jest.spyOn(JWK, "asKey").mockResolvedValue(mockKey as any);

      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
    });

    test("should throw error if JWT signing fails", async () => {
      const mockKey = { kty: "EC" };
      jest.spyOn(JWK, "asKey").mockResolvedValue(mockKey as any);
      const mockSign = {
        update: jest.fn().mockReturnThis(),
        final: jest.fn().mockRejectedValue(new Error("Signing error")),
      };
      jest.spyOn(JWS, "createSign").mockReturnValue(mockSign as any);

      await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
        InvalidAPIKeyFormatError,
      );
    });
  });
});

import { AxiosHeaders } from "axios";
import { CoinbaseAuthenticator } from "../coinbase/authenticator";
import { JWK, JWS } from "node-jose";
import { InvalidAPIKeyFormat } from "../coinbase/errors";

const VALID_CONFIG = {
  method: "GET",
  url: "https://api.cdp.coinbase.com/platform/v1/users/me",
  headers: {} as AxiosHeaders,
};

describe("Authenticator tests", () => {
  const filePath = "./config/test_api_key.json";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const keys = require(filePath);
  const authenticator = new CoinbaseAuthenticator(keys.name, keys.privateKey);
  let instance;
  let privateKey;
  let apiKey;

  beforeEach(() => {
    privateKey = "mockPrivateKey";
    apiKey = "mockApiKey";
    instance = new CoinbaseAuthenticator(privateKey, apiKey);
    instance.extractPemKey = jest.fn().mockReturnValue("mockPemPrivateKey");
    instance.nonce = jest.fn().mockReturnValue("mockNonce");
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should raise InvalidConfiguration error for invalid config", async () => {
    const invalidConfig = {
      method: "GET",
      url: "https://api.cdp.coinbase.com/platform/v1/users/me",
      headers: {} as AxiosHeaders,
    };
    const authenticator = new CoinbaseAuthenticator("api_key", "private_key");
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
    expect(correlationContext).toContain(",sdk_language=typescript");
  });

  it("invalid pem key should raise an InvalidAPIKeyFormat error", async () => {
    const invalidAuthenticator = new CoinbaseAuthenticator("test-key", "-----BEGIN EC KEY-----\n");
    expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow();
  });

  test("should throw error if private key cannot be parsed", async () => {
    jest.spyOn(JWK, "asKey").mockRejectedValue(new Error("Invalid key"));

    await expect(instance.buildJWT("https://example.com")).rejects.toThrow(InvalidAPIKeyFormat);
    await expect(instance.buildJWT("https://example.com")).rejects.toThrow(
      "Could not parse the private key",
    );
  });

  test("should throw error if key type is not EC", async () => {
    const mockKey = { kty: "RSA" };
    jest.spyOn(JWK, "asKey").mockResolvedValue(mockKey as any);

    await expect(instance.buildJWT("https://example.com")).rejects.toThrow(InvalidAPIKeyFormat);
  });

  test("should throw error if JWT signing fails", async () => {
    const mockKey = { kty: "EC" };
    jest.spyOn(JWK, "asKey").mockResolvedValue(mockKey as any);
    const mockSign = {
      update: jest.fn().mockReturnThis(),
      final: jest.fn().mockRejectedValue(new Error("Signing error")),
    };
    jest.spyOn(JWS, "createSign").mockReturnValue(mockSign as any);

    await expect(instance.buildJWT("https://example.com")).rejects.toThrow(InvalidAPIKeyFormat);
  });
});

import { AxiosHeaders } from "axios";
import { CoinbaseAuthenticator } from "../authenticator";

const VALID_CONFIG = {
  method: "GET",
  url: "https://api.cdp.coinbase.com/platform/v1/users/me",
  headers: {} as AxiosHeaders,
};

describe("Authenticator tests", () => {
  const filePath = "./config/coinbase_cloud_api_key.json";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const keys = require(filePath);
  const authenticator = new CoinbaseAuthenticator(keys.name, keys.privateKey);

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
    const config = await authenticator.authenticateRequest(VALID_CONFIG);
    const token = config.headers?.Authorization as string;
    expect(token).toContain("Bearer ");
    expect(token?.length).toBeGreaterThan(100);
  });

  it("invalid pem key should raise an InvalidAPIKeyFormat error", async () => {
    const invalidAuthenticator = new CoinbaseAuthenticator("test-key", "-----BEGIN EC KEY-----\n");
    expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow();
  });
});

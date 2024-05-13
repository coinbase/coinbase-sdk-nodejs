import { AxiosHeaders } from "axios";
import { CoinbaseAuthenticator } from "../authenticator";

const VALID_KEY =
  "organizations/0c3bbe72-ac81-46ec-946a-7cd019d6d86b/apiKeys/db813705-bf33-4e33-816c-4c3f1f54672b";
const VALID_PRIVATE_KEY =
  "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIBPl8LBKrDw2Is+bxQEXa2eHhDmvIgArOhSAdmYpYQrCoAoGCCqGSM49\nAwEHoUQDQgAEQSoVSr8ImpS18thpGe3KuL9efy+L+AFdFFfCVwGgCsKvTYVDKaGo\nVmN5Bl6EJkeIQjyarEtWbmY6komwEOdnHA==\n-----END EC PRIVATE KEY-----\n";

const VALID_CONFIG = {
  method: "GET",
  url: "https://api.cdp.coinbase.com/platform/v1/users/me",
  headers: {} as AxiosHeaders,
};

describe("Authenticator tests", () => {
  const authenticator = new CoinbaseAuthenticator(VALID_KEY, VALID_PRIVATE_KEY);
  it("should raise InvalidConfiguration error", async () => {
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
    // length of the token should be greater than 100
    expect(token?.length).toBeGreaterThan(100);
  });

  it("invalid pem key should raise an error", () => {
    const invalidAuthenticator = new CoinbaseAuthenticator(
      "test-key",
      "-----BEGIN EC PRIVATE KEY-----+L+==\n-----END EC PRIVATE KEY-----\n",
    );
    expect(invalidAuthenticator.authenticateRequest(VALID_CONFIG)).rejects.toThrow();
  });
});

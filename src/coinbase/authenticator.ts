import { InternalAxiosRequestConfig } from "axios";
import { JWK, JWS } from "node-jose";
import { InvalidAPIKeyFormat } from "./errors";

const pemHeader = "-----BEGIN EC PRIVATE KEY-----";
const pemFooter = "-----END EC PRIVATE KEY-----";

/**
 * A class that builds JWTs for authenticating with the Coinbase Platform APIs.
 */
export class CoinbaseAuthenticator {
  private apiKey: string;
  private privateKey: string;

  /**
   * Initializes the Authenticator.
   *
   * @param {string} apiKey - The API key name.
   * @param {string} privateKey - The private key associated with the API key.
   */
  constructor(apiKey: string, privateKey: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
  }

  /**
   * Middleware to intercept requests and add JWT to Authorization header.
   *
   * @param {InternalAxiosRequestConfig} config - The request configuration.
   * @param {boolean} debugging - Flag to enable debugging.
   * @returns {Promise<InternalAxiosRequestConfig>} The request configuration with the Authorization header added.
   * @throws {InvalidAPIKeyFormat} If JWT could not be built.
   */
  async authenticateRequest(
    config: InternalAxiosRequestConfig,
    debugging = false,
  ): Promise<InternalAxiosRequestConfig> {
    const method = config.method?.toString().toUpperCase();
    const token = await this.buildJWT(config.url || "", method);
    if (debugging) {
      console.log(`API REQUEST: ${method} ${config.url}`);
    }
    config.headers["Authorization"] = `Bearer ${token}`;
    config.headers["Content-Type"] = "application/json";
    return config;
  }

  /**
   * Builds the JWT for the given API endpoint URL.
   *
   * @param {string} url - URL of the API endpoint.
   * @param {string} method - HTTP method of the request.
   * @returns {Promise<string>} JWT token.
   * @throws {InvalidAPIKeyFormat} If the private key is not in the correct format.
   */
  async buildJWT(url: string, method = "GET"): Promise<string> {
    const pemPrivateKey = this.extractPemKey(this.privateKey);
    let privateKey: JWK.Key;

    try {
      privateKey = await JWK.asKey(pemPrivateKey, "pem");
      if (privateKey.kty !== "EC") {
        throw new InvalidAPIKeyFormat("Invalid key type");
      }
    } catch (error) {
      throw new InvalidAPIKeyFormat("Could not parse the private key");
    }

    const header = {
      alg: "ES256",
      kid: this.apiKey,
      typ: "JWT",
      nonce: this.nonce(),
    };

    const urlObject = new URL(url);
    const uri = `${method} ${urlObject.host}${urlObject.pathname}`;
    const claims = {
      sub: this.apiKey,
      iss: "cdp",
      aud: ["cdp_service"],
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60, // +1 minute
      uris: [uri],
    };

    const payload = Buffer.from(JSON.stringify(claims)).toString("utf8");
    try {
      const result = await JWS.createSign({ format: "compact", fields: header }, privateKey)
        .update(payload)
        .final();

      return result as unknown as string;
    } catch (err) {
      throw new InvalidAPIKeyFormat("Could not sign the JWT");
    }
  }

  /**
   * Extracts the PEM key from the given private key string.
   *
   * @param {string} privateKeyString - The private key string.
   * @returns {string} The PEM key.
   * @throws {InvalidAPIKeyFormat} If the private key string is not in the correct format.
   */
  private extractPemKey(privateKeyString: string): string {
    privateKeyString = privateKeyString.replace(/\n/g, "");

    if (privateKeyString.startsWith(pemHeader) && privateKeyString.endsWith(pemFooter)) {
      return privateKeyString;
    }

    throw new InvalidAPIKeyFormat("Invalid private key format");
  }

  /**
   * Generates a random nonce for the JWT.
   *
   * @returns {string} The generated nonce.
   */
  private nonce(): string {
    const range = "0123456789";
    let result = "";

    for (let i = 0; i < 16; i++) {
      result += range.charAt(Math.floor(Math.random() * range.length));
    }

    return result;
  }
}

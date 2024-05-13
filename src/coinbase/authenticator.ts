import { JWK, JWS } from "node-jose";
import { InternalError, InvalidAPIKeyFormat } from "./errors";
import { InternalAxiosRequestConfig } from "axios";

const pemHeader = "-----BEGIN EC PRIVATE KEY-----";
const pemFooter = "-----END EC PRIVATE KEY-----";

/* A class that builds JWTs for authenticating with the Coinbase Platform APIs. */
export class CoinbaseAuthenticator {
  private apiKey: string;
  private privateKey: string;

  /*
   * Initializes the Authenticator.
   * @constructor
   * @param {string} apiKey - The API key name.
   * @param {string} privateKey - The private key associated with the API key.
   */
  constructor(apiKey: string, privateKey: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
  }

  /*
   * Middleware to intercept requests and add JWT to the Authorization header for AxiosInterceptor
   * @param {MiddlewareRequestType} config - The request configuration.
   * @returns {MiddlewareRequestType} The request configuration with the Authorization header added.
   * @throws {InternalError} If there is an issue with the private key.
   */
  async authenticateRequest(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    const method = config.method?.toString().toUpperCase();
    const token = await this.buildJWT(config.url || "", method);

    config.headers["Authorization"] = `Bearer ${token}`;
    config.headers["Content-Type"] = "application/json";
    return config;
  }

  /*
   * Builds the JWT for the given API endpoint URI. The JWT is signed with the API key's private key.
   * @param {string} url - The URI of the API endpoint.
   * @param {string} method - The HTTP method of the request.
   * @returns {string} The JWT if successful or throws an error.
   * @throws {InternalError} If there is an issue with the private key.
   */
  async buildJWT(url: string, method = "GET"): Promise<string> {
    const pemPrivateKey = this.extractPemKey(this.privateKey);
    let privateKey: JWK.Key;

    try {
      privateKey = await JWK.asKey(pemPrivateKey, "pem");
      if (privateKey.kty !== "EC") {
        throw InternalError;
      }
    } catch (error) {
      throw InternalError;
    }

    const header = {
      alg: "ES256",
      kid: this.apiKey,
      typ: "JWT",
      nonce: this.nonce(),
    };

    const uri = `${method} ${url.substring(8)}`;
    const claims = {
      sub: this.apiKey,
      iss: "coinbase-cloud",
      aud: ["cdp_service"],
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60, // +1 minute
      uri,
    };

    const payload = Buffer.from(JSON.stringify(claims)).toString("utf8");
    try {
      const result = await JWS.createSign({ format: "compact", fields: header }, privateKey)
        .update(payload)
        .final();

      return result as unknown as string;
    } catch (err) {
      throw InternalError;
    }
  }

  /*
   * Extracts the PEM key from the given private key string.
   * @param {string} privateKeyString - The private key string.
   * @returns {string} The PEM key.
   * @throws {InvalidAPIKeyFormat} If the private key string is not in the correct format.
   */
  private extractPemKey(privateKeyString: string): string {
    // Remove all newline characters
    privateKeyString = privateKeyString.replace(/\n/g, "");

    if (privateKeyString.startsWith(pemHeader) && privateKeyString.endsWith(pemFooter)) {
      return privateKeyString;
    }

    throw InvalidAPIKeyFormat;
  }

  /*
   * Generates a random nonce for the JWT.
   * @returns {string}
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

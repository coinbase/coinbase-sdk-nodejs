import { InternalAxiosRequestConfig } from "axios";
import { JWK, JWS } from "node-jose";
import { InvalidAPIKeyFormatError } from "./errors";
import { version } from "../../package.json";

const pemHeader = "-----BEGIN EC PRIVATE KEY-----";
const pemFooter = "-----END EC PRIVATE KEY-----";

/**
 * A class that builds JWTs for authenticating with the Coinbase Platform APIs.
 */
export class CoinbaseAuthenticator {
  private apiKey: string;
  private privateKey: string;
  private source: string;
  private sourceVersion?: string;

  /**
   * Initializes the Authenticator.
   *
   * @param {string} apiKey - The API key name.
   * @param {string} privateKey - The private key associated with the API key.
   * @param {string} source - The source of the request.
   * @param {string} sourceVersion - The version of the source.
   */
  constructor(apiKey: string, privateKey: string, source: string, sourceVersion?: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
    this.source = source;
    this.sourceVersion = sourceVersion;
  }

  /**
   * Middleware to intercept requests and add JWT to Authorization header.
   *
   * @param {InternalAxiosRequestConfig} config - The request configuration.
   * @param {boolean} debugging - Flag to enable debugging.
   * @returns {Promise<InternalAxiosRequestConfig>} The request configuration with the Authorization header added.
   * @throws {InvalidAPIKeyFormatError} If JWT could not be built.
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
    config.headers["Correlation-Context"] = this.getCorrelationData();
    return config;
  }

  /**
   * Builds the JWT for the given API endpoint URL.
   *
   * @param {string} url - URL of the API endpoint.
   * @param {string} method - HTTP method of the request.
   * @returns {Promise<string>} JWT token.
   * @throws {InvalidAPIKeyFormatError} If the private key is not in the correct format.
   */
  async buildJWT(url: string, method = "GET"): Promise<string> {
    let privateKeyObj: JWK.Key;
    let header: any;

    if (this.privateKey.startsWith("-----BEGIN")) {
      // Use PEM as an EC key (ES256)
      const pemPrivateKey = this.extractPemKey(this.privateKey);
      privateKeyObj = await JWK.asKey(pemPrivateKey, "pem");
      if (privateKeyObj.kty !== "EC") {
        throw new InvalidAPIKeyFormatError("Invalid key type; expected EC key");
      }
      header = {
        alg: "ES256",
        kid: this.apiKey,
        typ: "JWT",
        nonce: this.nonce(),
      };
    } else {
      // Assume Base64 encoded Ed25519 key (64 bytes)
      const decoded = Buffer.from(this.privateKey, "base64");
      if (decoded.length !== 64) {
        throw new InvalidAPIKeyFormatError(
          `Invalid Ed25519 private key length: got ${decoded.length}, expected 64`
        );
      }
      const seed = decoded.slice(0, 32);
      const publicKey = decoded.slice(32);

      // Helper: convert standard Base64 to Base64URL (without padding)
      const toBase64Url = (buf: Buffer): string =>
        buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      const jwk = {
        kty: "OKP",
        crv: "Ed25519",
        d: toBase64Url(seed),
        x: toBase64Url(publicKey),
      };

      privateKeyObj = await JWK.asKey(jwk);
      header = {
        alg: "EdDSA",
        kid: this.apiKey,
        typ: "JWT",
        nonce: this.nonce(),
      };
    }

    const urlObject = new URL(url);
    const uri = `${method} ${urlObject.host}${urlObject.pathname}`;
    const claims = {
      sub: this.apiKey,
      iss: "cdp",
      aud: ["cdp_service"],
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60, // +1 minute expiry
      uris: [uri],
    };

    const payload = Buffer.from(JSON.stringify(claims)).toString("utf8");

    try {
      const result = await JWS.createSign({ format: "compact", fields: header }, privateKeyObj)
        .update(payload)
        .final();
      return result as unknown as string;
    } catch (err) {
      throw new InvalidAPIKeyFormatError("Could not sign the JWT");
    }
  }

  /**
   * Extracts the PEM key from the given private key string.
   *
   * @param {string} privateKeyString - The private key string.
   * @returns {string} The PEM key.
   * @throws {InvalidAPIKeyFormatError} If the private key string is not in the correct format.
   */
  private extractPemKey(privateKeyString: string): string {
    // Remove newline characters for uniformity
    privateKeyString = privateKeyString.replace(/\n/g, "");
    if (privateKeyString.startsWith(pemHeader) && privateKeyString.endsWith(pemFooter)) {
      return privateKeyString;
    }
    throw new InvalidAPIKeyFormatError("Invalid private key format");
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

  /**
   * Returns encoded correlation data including the SDK version and language.
   *
   * @returns {string} Encoded correlation data.
   */
  private getCorrelationData(): string {
    const data: Record<string, string> = {
      sdk_version: version,
      sdk_language: "typescript",
      source: this.source,
    };
    if (this.sourceVersion) {
      data["source_version"] = this.sourceVersion;
    }
    return Object.keys(data)
      .map((key) => `${key}=${encodeURIComponent(data[key])}`)
      .join(",");
  }
}

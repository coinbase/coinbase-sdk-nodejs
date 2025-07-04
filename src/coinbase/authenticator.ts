import { createPrivateKey } from "crypto";
import { InternalAxiosRequestConfig } from "axios";
import { SignJWT, importPKCS8, importJWK, JWTPayload } from "jose";
import { InvalidAPIKeyFormatError } from "./errors";
import { version } from "../../package.json";

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
   * @param {string} [sourceVersion] - The version of the source.
   */
  constructor(apiKey: string, privateKey: string, source: string, sourceVersion?: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
    this.source = source;
    this.sourceVersion = sourceVersion;
  }

  /**
   * Middleware to intercept requests and add JWT to the Authorization header.
   *
   * @param {InternalAxiosRequestConfig} config - The request configuration.
   * @param {boolean} [debugging] - Flag to enable debugging.
   * @returns {Promise<InternalAxiosRequestConfig>} The modified request configuration with the Authorization header added.
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
   * @param {string} [method] - HTTP method of the request.
   * @returns {Promise<string>} A JWT token.
   * @throws {InvalidAPIKeyFormatError} If the private key is not in the correct format or signing fails.
   */
  async buildJWT(url: string, method = "GET"): Promise<string> {
    const urlObject = new URL(url);
    const uri = `${method} ${urlObject.host}${urlObject.pathname}`;
    const now = Math.floor(Date.now() / 1000);
    const claims: JWTPayload = {
      sub: this.apiKey,
      iss: "cdp",
      aud: ["cdp_service"],
      uris: [uri],
    };

    if (this.privateKey.startsWith("-----BEGIN")) {
      return this.buildECJWT(claims, now);
    } else {
      return this.buildEdwardsJWT(claims, now);
    }
  }

  /**
   * Builds a JWT using an EC key.
   *
   * @param {JWTPayload} claims - The JWT claims.
   * @param {number} now - The current timestamp (in seconds).
   * @returns {Promise<string>} A JWT token signed with an EC key.
   * @throws {InvalidAPIKeyFormatError} If the key conversion, import, or signing fails.
   */
  private async buildECJWT(claims: JWTPayload, now: number): Promise<string> {
    // Ensure the PEM is valid and let jose import it.
    const pemPrivateKey = this.extractPemKey(this.privateKey);
    let pkcs8Key: string;
    try {
      const keyObj = createPrivateKey(pemPrivateKey);
      pkcs8Key = keyObj.export({ type: "pkcs8", format: "pem" }).toString();
    } catch (error) {
      throw new InvalidAPIKeyFormatError("Could not convert the EC private key to PKCS8 format");
    }
    let ecKey;
    try {
      ecKey = await importPKCS8(pkcs8Key, "ES256");
    } catch (error) {
      throw new InvalidAPIKeyFormatError("Could not import the EC private key");
    }
    try {
      return await new SignJWT(claims)
        .setProtectedHeader({ alg: "ES256", kid: this.apiKey, typ: "JWT", nonce: this.nonce() })
        .setIssuedAt(now)
        .setNotBefore(now)
        .setExpirationTime(now + 60)
        .sign(ecKey);
    } catch (err) {
      throw new InvalidAPIKeyFormatError("Could not sign the JWT with the EC key");
    }
  }

  /**
   * Builds a JWT using an Ed25519 key.
   *
   * @param {JWTPayload} claims - The JWT claims.
   * @param {number} now - The current timestamp (in seconds).
   * @returns {Promise<string>} A JWT token signed with an Ed25519 key.
   * @throws {InvalidAPIKeyFormatError} If the key parsing, import, or signing fails.
   */
  private async buildEdwardsJWT(claims: JWTPayload, now: number): Promise<string> {
    // Expect a base64 encoded 64-byte string (32 bytes seed + 32 bytes public key)
    const decoded = Buffer.from(this.privateKey, "base64");
    if (decoded.length !== 64) {
      throw new InvalidAPIKeyFormatError("Could not parse the private key");
    }
    const seed = decoded.subarray(0, 32);
    const publicKey = decoded.subarray(32);
    const jwk = {
      kty: "OKP",
      crv: "Ed25519",
      d: seed.toString("base64url"),
      x: publicKey.toString("base64url"),
    };
    let key;
    try {
      key = await importJWK(jwk, "EdDSA");
    } catch (error) {
      throw new InvalidAPIKeyFormatError("Could not import the Ed25519 private key");
    }
    try {
      return await new SignJWT(claims)
        .setProtectedHeader({ alg: "EdDSA", kid: this.apiKey, typ: "JWT", nonce: this.nonce() })
        .setIssuedAt(now)
        .setNotBefore(now)
        .setExpirationTime(now + 60)
        .sign(key);
    } catch (err) {
      throw new InvalidAPIKeyFormatError("Could not sign the JWT with the Ed25519 key");
    }
  }

  /**
   * Extracts and verifies the PEM key from the given private key string.
   *
   * @param {string} privateKeyString - The private key string.
   * @returns {string} The original PEM key string if valid.
   * @throws {InvalidAPIKeyFormatError} If the private key string is not in the correct PEM format.
   */
  private extractPemKey(privateKeyString: string): string {
    if (
      privateKeyString.includes("-----BEGIN EC PRIVATE KEY-----") &&
      privateKeyString.includes(pemFooter)
    ) {
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
   * @returns {string} Encoded correlation data as a query string.
   */
  private getCorrelationData(): string {
    const data = {
      sdk_version: version,
      sdk_language: "typescript",
      source: this.source,
    };
    if (this.sourceVersion) {
      data["source_version"] = this.sourceVersion;
    }
    return Object.keys(data)
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join(",");
  }
}

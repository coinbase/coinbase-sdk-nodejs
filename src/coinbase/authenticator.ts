import { InternalAxiosRequestConfig } from "axios";
import { JWK, JWS } from "node-jose";
import { InvalidAPIKeyFormatError } from "./errors";
import { version } from "../../package.json";

const pemHeader = "-----BEGIN EC PRIVATE KEY-----";
const pemFooter = "-----END EC PRIVATE KEY-----";

export class CoinbaseAuthenticator {
  private apiKey: string;
  private privateKey: string;
  private source: string;
  private sourceVersion?: string;

  constructor(apiKey: string, privateKey: string, source: string, sourceVersion?: string) {
    this.apiKey = apiKey;
    this.privateKey = privateKey;
    this.source = source;
    this.sourceVersion = sourceVersion;
  }

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

  async buildJWT(url: string, method = "GET"): Promise<string> {
    let privateKeyObj: JWK.Key;
    let header: any;

    if (this.privateKey.startsWith("-----BEGIN")) {
      // Existing behavior: use PEM as an EC key (ES256)
      const pemPrivateKey = this.extractPemKey(this.privateKey);
      try {
        privateKeyObj = await JWK.asKey(pemPrivateKey, "pem");
      } catch (error) {
        throw new InvalidAPIKeyFormatError("Could not parse the private key");
      }
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
      // New behavior: assume Base64 encoded Ed25519 key (64 bytes)
      const decoded = Buffer.from(this.privateKey, "base64");
      if (decoded.length !== 64) {
        throw new InvalidAPIKeyFormatError(
          `Invalid Ed25519 private key length: got ${decoded.length}, expected 64`
        );
      }
      const seed = decoded.slice(0, 32);
      const publicKey = decoded.slice(32);
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
      exp: Math.floor(Date.now() / 1000) + 60,
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

  private extractPemKey(privateKeyString: string): string {
    privateKeyString = privateKeyString.replace(/\n/g, "");
    if (privateKeyString.startsWith(pemHeader) && privateKeyString.endsWith(pemFooter)) {
      return privateKeyString;
    }
    throw new InvalidAPIKeyFormatError("Invalid private key format");
  }

  private nonce(): string {
    const range = "0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += range.charAt(Math.floor(Math.random() * range.length));
    }
    return result;
  }

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

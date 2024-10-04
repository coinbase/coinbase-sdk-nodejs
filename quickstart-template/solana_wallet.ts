import { KeyPairSigner, createKeyPairSignerFromBytes } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import { env } from "process";

const DEFAULT_SOLANA_CLI_WALLET_PATH = "~/.config/solana/id.json";
const CB_KEYPAIR_ENV_VAR = "COINBASE_SDK_KEY";
const DEFAULT_KEY_PATH = "~/.config/coinbase/api-key.json";

// Looks for the api key in the home config dir if it's not present it will look
// for the path on the COINBASE_SDK_KEY env var.
export function coinbaseApiKeyPath(): string {
  const key = env[CB_KEYPAIR_ENV_VAR];

  return key ? key : DEFAULT_KEY_PATH;
}

// Get a solana-cli compatible key from disk, defaults to the default solana-cli wallet path.
export async function getKeypair(path?: string): Promise<KeyPairSigner> {
  const bs = readFileSync(replaceHome(path ? path : DEFAULT_SOLANA_CLI_WALLET_PATH));

  const pkBytes = new Uint8Array(JSON.parse(bs.toString()));

  return await createKeyPairSignerFromBytes(pkBytes);
}

function replaceHome(filePath: string): string {
  return filePath.startsWith("~") ? filePath.replace("~", homedir()) : filePath;
}

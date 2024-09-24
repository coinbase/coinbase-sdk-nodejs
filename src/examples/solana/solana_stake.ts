import { Coinbase } from "../../coinbase/coinbase";
import { NetworkIdentifier, StakingOperation } from "../../client";
import { readFileSync } from "fs";
import { homedir } from "os";
import {
  KeyPairSigner,
  createSolanaRpc,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  signTransaction,
  createKeyPairSignerFromBytes,
} from "@solana/web3.js";
import * as bs58 from "bs58";

const apiKeyFilePath = "/Users/drmoo/.apikeys/prod.json";

/**
 * Performs staking operations for a given signer.
 *
 * @param {KeyPairSigner} signer - The signer to perform staking operations for.
 */
async function stakeOperations(signer: KeyPairSigner) {
  Coinbase.configureFromJson({ filePath: apiKeyFilePath });

  const ctx = (
    await Coinbase.apiClients.stake?.getStakingContext({
      network_id: NetworkIdentifier.SolanaDevnet,
      address_id: signer.address.toString(),
      asset_id: Coinbase.assets.Sol,
      options: {},
    })
  )?.data.context;

  console.log("Stakeable: ");
  console.log(ctx?.stakeable_balance.amount);
  console.log(ctx?.stakeable_balance.asset);
  const ops: Array<StakingOperation> = new Array<StakingOperation>();

  {
    const amount = ctx?.stakeable_balance.amount
      ? BigInt(ctx?.stakeable_balance.amount.toString())
      : 0;
    if (amount > 1)
      ops.push(
        (await Coinbase.apiClients.stake!.buildStakingOperation({
          action: "stake",
          address_id: signer.address.toString(),
          asset_id: Coinbase.assets.Sol,
          network_id: NetworkIdentifier.SolanaDevnet,
          options: { amount: "100000000" },
        }))!.data!,
      );
  }

  console.log("Unstakeable: ");
  console.log(ctx?.unstakeable_balance.amount);
  console.log(ctx?.unstakeable_balance.asset);

  {
    const amount = ctx?.unstakeable_balance.amount
      ? BigInt(ctx?.unstakeable_balance.amount.toString())
      : 0;
    if (amount > 1)
      ops.push(
        (await Coinbase.apiClients.stake!.buildStakingOperation({
          action: "unstake",
          address_id: signer.address.toString(),
          asset_id: Coinbase.assets.Sol,
          network_id: NetworkIdentifier.SolanaDevnet,
          options: { amount: "100000000" },
        }))!.data!,
      );
  }

  console.log("Claimable: ");
  console.log(ctx?.claimable_balance.amount);
  console.log(ctx?.claimable_balance.asset);

  {
    const amount = ctx?.claimable_balance.amount
      ? BigInt(ctx?.claimable_balance.amount.toString())
      : 0;
    if (amount > 1)
      ops.push(
        (await Coinbase.apiClients.stake!.buildStakingOperation({
          action: "claim_stake",
          address_id: signer.address.toString(),
          asset_id: Coinbase.assets.Sol,
          network_id: NetworkIdentifier.SolanaDevnet,
          options: { amount: "100000000" },
        }))!.data!,
      );
  }

  const rpc = createSolanaRpc("https://api.devnet.solana.com");

  for (const op of ops) {
    for (const tx of op.transactions) {
      const txmsg = getTransactionDecoder().decode(bs58.default.decode(tx.unsigned_payload));
      const signed = await signTransaction([signer.keyPair], txmsg);
      const sig = await rpc
        .sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: "base64" })
        .send();

      console.log(`txLink: ${getTxLink(NetworkIdentifier.SolanaDevnet, sig)}`);
    }
  }
}

/**
 * Generates a transaction link for Solana explorer based on the network ID and signature.
 *
 * @param networkID - The network identifier ("solana-mainnet" or "solana-devnet").
 * @param signature - The transaction signature.
 * @returns The URL for the transaction on Solana explorer.
 */
function getTxLink(networkID: string, signature: string): string {
  if (networkID == "solana-mainnet") {
    return "https://explorer.solana.com/tx/" + signature;
  } else if (networkID == "solana-devnet") {
    return "https://explorer.solana.com/tx/" + signature + "?cluster=devnet";
  }

  return "";
}

/**
 * Retrieves a KeyPairSigner from a file path.
 *
 * @param path - Optional path to the key file. If not provided, uses the default Solana CLI wallet path.
 * @returns A Promise that resolves to a KeyPairSigner.
 */
async function getKeypair(path?: string): Promise<KeyPairSigner> {
  const DEFAULT_SOLANA_CLI_WALLET_PATH = "~/.config/solana/id.json";

  const bs = readFileSync(replaceHome(path ? path : DEFAULT_SOLANA_CLI_WALLET_PATH));

  const pkBytes = new Uint8Array(JSON.parse(bs.toString()));

  return await createKeyPairSignerFromBytes(pkBytes);
}

/**
 * Replaces the tilde (~) in a file path with the user's home directory.
 *
 * @param filePath - The file path to process.
 * @returns The processed file path with the tilde replaced by the home directory if present.
 */
function replaceHome(filePath: string): string {
  return filePath.startsWith("~") ? filePath.replace("~", homedir()) : filePath;
}

const keyPair = getKeypair();
keyPair.then(keyPair => {
  stakeOperations(keyPair);
});

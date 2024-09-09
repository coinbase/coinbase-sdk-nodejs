import { Coinbase, ExternalAddress } from "./src";
import { Connection, Transaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const networkID = Coinbase.networks.SolanaDevnet;
const walletAddress = "9NL2SkpcsdyZwsG8NmHGNra4i4NSyKbJTVd9fUQ7kJHR";
const solanaDevnetNodeURL = "SOLANA_DEVNET_RPC_URL";

const connection = new Connection(solanaDevnetNodeURL);
const secretKey = Uint8Array.from(bs58.decode(process.env.SOL_PRIVATE_KEY));
const key = Keypair.fromSecretKey(secretKey);

/**
 * stake solana
 */
async function stake() {
  Coinbase.configureFromJson({
    filePath: "~/code/cb/staking/.coinbase_cloud_api_key_dev.json",
    basePath: "http://localhost:8004",
  });

  // Create a new external address on the ethereum-holesky testnet network.
  const address = new ExternalAddress(networkID, walletAddress);

  // Find out how much SOL is available to stake.
  const stakeableBalance = await address.stakeableBalance(Coinbase.assets.Sol);
  console.log("Stakeable balance is %s SOL", stakeableBalance);

  // Build a stake transaction for an amount <= stakeableBalance
  process.stdout.write("Building a transaction to stake 0.1 SOL...");
  const stakingOperation = await address.buildStakeOperation(0.1, Coinbase.assets.Sol);
  console.log("Done.");

  console.log("Staking operation: %s", stakingOperation);

  for (const tx of stakingOperation.getTransactions()) {
    const transaction = Transaction.from(bs58.decode(tx.getUnsignedPayload()));

    transaction.partialSign(key);

    try {
      const signature = await connection.sendRawTransaction(transaction.serialize());
      console.log("Transaction signature:", getSolanaExplorerLink(signature, networkID));
    } catch (error) {
      console.error("Failed to send transaction:", error);
    }
  }
}

/**
 * Get the Solana explorer link for a given transaction signature.
 *
 * @param signature - The transaction signature
 * @param networkID - The network ID
 * @returns The Solana explorer link
 */
function getSolanaExplorerLink(signature: string, networkID: string): string {
  const baseUrl = "https://explorer.solana.com/tx";

  let network = "mainnet";
  if (networkID === Coinbase.networks.SolanaDevnet) {
    network = "devnet";
  }

  return `${baseUrl}/${signature}?cluster=${network}`;
}

(async () => {
  try {
    await stake();
  } catch (error) {
    console.error("Error during stake operation", error);
  }
})();

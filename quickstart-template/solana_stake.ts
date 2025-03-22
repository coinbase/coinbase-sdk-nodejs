import { Coinbase } from "@coinbase/coinbase-sdk";
import { coinbaseApiKeyPath, getKeypair } from "./solana_wallet";
import {
  KeyPairSigner,
  createSolanaRpc,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  signTransaction,
} from "@solana/kit";
import * as bs58 from "bs58";
import { NetworkIdentifier } from "@coinbase/coinbase-sdk/dist/client";

// Get data about staking for the provided wallet, get stakable balance, unstakeable balances and
// balances that can be claimed back.
async function stakeOperations(signer: KeyPairSigner) {
  const ctx = (
    await Coinbase.apiClients.stake?.getStakingContext({
      network_id: "solana-devnet",
      address_id: signer.address.toString(),
      asset_id: Coinbase.assets.Sol,
      options: {},
    })
  )?.data.context;

  console.log("Stakeable: ");
  console.log(ctx?.stakeable_balance.amount);
  console.log(ctx?.stakeable_balance.asset);
  let ops: Array<any> = new Array<any>();

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

  for (let op of ops) {
    for (let tx of op.transactions) {
      let txmsg = getTransactionDecoder().decode(bs58.default.decode(tx.unsigned_payload));
      let signed = await signTransaction([signer.keyPair], txmsg);
      let sig = await rpc
        .sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: "base64" })
        .send();

      console.log(`txLink: ${getTxLink(NetworkIdentifier.SolanaDevnet, sig)}`);
    }
  }
}

function getTxLink(networkID: string, signature: string): string {
  if (networkID == "solana-mainnet") {
    return "https://explorer.solana.com/tx/" + signature;
  } else if (networkID == "solana-devnet") {
    return "https://explorer.solana.com/tx/" + signature + "?cluster=devnet";
  }

  return "";
}

// Initialize the sdk with the api key
Coinbase.configureFromJson({ filePath: coinbaseApiKeyPath() });

// GetKeypair will try to read the default path of the solana CLI keypair
const keyPair = getKeypair();
keyPair.then(kp => {
  stakeOperations(kp);
});

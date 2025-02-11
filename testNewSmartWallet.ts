import { createWalletClient, http, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Coinbase, ExternalAddress, Wallet } from "./src";
import { mainnet } from "viem/chains";
import { createSmartWallet } from "./src/coinbase/wallets/createSmartWallet";

Coinbase.configureFromJson({
  filePath: "~/.apikeys/dev.json",
  debugging: true,
  basePath: "https://cloud-api-dev.cbhq.net/platform",
});

async function main() {
  // create a smart wallet with viem wallet owner
  const privateKey = generatePrivateKey();
  const owner = privateKeyToAccount(privateKey);
  const smartWallet = await createSmartWallet({ account: owner });
  smartWallet.useNetwork({ networkId: Coinbase.networks.BaseSepolia });

  // Faucet the smart wallet using an External Address
  const externalAdress = new ExternalAddress(Coinbase.networks.BaseSepolia, smartWallet.address);
  const faucet = await externalAdress.faucet();
  await faucet.wait();

  const userOperation = await smartWallet.sendUserOperation({
    calls: [
      {
        to: "0x1234567890123456789012345678901234567890",
        value: parseEther("0.00001"),
        data: "0x",
      },
    ],
  });
  const completedUserOperation = await userOperation.wait();
}

main();

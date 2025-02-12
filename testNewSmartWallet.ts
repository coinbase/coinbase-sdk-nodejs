import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Coinbase, ExternalAddress, Wallet } from "./src";
import { baseSepolia } from "viem/chains";
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
  smartWallet.useNetwork({ chain: baseSepolia });

  // Faucet the smart wallet using an External Address
  const externalAdress = new ExternalAddress(Coinbase.networks.BaseSepolia, smartWallet.address);
  const faucet = await externalAdress.faucet();
  await faucet.wait();

  // create a wallet address to send to and check its balance after
  const wallet = await Wallet.create();
  const walletAddress = await wallet.getDefaultAddress();

  const userOperation = await smartWallet.sendUserOperation({
    calls: [
      {
        to: walletAddress.getId(),
        value: parseEther("0.000001"),
        data: "0x",
      },
    ],
  });
  console.log("userOperation status", userOperation.status);
  const completedUserOperation = await userOperation.wait();
  console.log("completedUserOperation status", completedUserOperation.status);

  // get final balance now
  const finalBalance = await walletAddress.getBalance("eth");
  console.log("finalBalance", finalBalance);
}

main();

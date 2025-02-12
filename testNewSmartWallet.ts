import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Coinbase, ExternalAddress, Wallet } from "./src";
import { createSmartWallet } from "./src/coinbase/wallets/createSmartWallet";

Coinbase.configureFromJson({
  filePath: "~/.apikeys/dev.json",
  debugging: true,
  basePath: "https://cloud-api-dev.cbhq.net/platform/"
});

async function main() {
  // create a smart wallet with viem wallet owner
  const privateKey = generatePrivateKey();
  const owner = privateKeyToAccount(privateKey);
  const smartWallet = await createSmartWallet({ account: owner });
  smartWallet.switchChain({ chainId: 84532 });

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
        to: walletAddress.getId() as `0x${string}`,
        value: parseEther("0.000001"),
        data: "0x",
      },
    ],
  });
  const userOperationResult = await userOperation.wait();

  // get final balance now
  const finalBalance = await walletAddress.getBalance("eth");
  console.log("finalBalance", finalBalance);
}

main();

import { parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Coinbase, ExternalAddress, Wallet } from './src/index';
import { createSmartWallet } from './src/index';
import { waitForUserOperation } from "./src/actions/waitForUserOperation";

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
    chainId: 84532,
  });

  const userOperationResult = await waitForUserOperation({
    ...userOperation,
    timeoutSeconds: 10000,
    intervalSeconds: 1,
  });

  console.log("userOperationResult", userOperationResult);

//  const userOperationResult = await userOperation.wait();

 // const userOperationResult = await waitForUserOperation(userOperation)


  // get final balance now
  const finalBalance = await walletAddress.getBalance("eth");
  console.log("finalBalance", finalBalance);
}

main();

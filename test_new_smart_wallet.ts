import { createWalletClient, http, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { Coinbase, Wallet } from './src'
import { mainnet } from 'viem/chains';
import { createSmartWallet } from './src/coinbase/wallets/createSmartWallet'

Coinbase.configureFromJson({
  filePath: "~/.apikeys/dev.json",
  debugging: true,
  basePath: "http://localhost:8002"
});

async function main() {
  // create a wallet
  const wallet = await Wallet.create();

   // faucet it
   const faucet = await wallet.faucet();
   await faucet.wait();

  // create a smart wallet with viem wallet owner
  const privateKey = generatePrivateKey()
  const owner = privateKeyToAccount(privateKey)
  const smartWallet = await createSmartWallet({account: owner})

  smartWallet.use({networkId: Coinbase.networks.BaseSepolia })

  // send ETH from wallet to smart wallet so the smart wallet has funds to send back
  const currentBalance = await wallet.getBalance("eth")
  const halfBalance = currentBalance.div(2)

  const transfer = await wallet.createTransfer({
    amount: halfBalance, // send half since we need some funds for gas
    assetId: "eth",
    destination: smartWallet.address,
  })
  await transfer.wait()

  // I believe that SCW-Manager should automatically sponsor all base-sepolia user operations so we don't need to have additional funds for gas
  const userOperation = await smartWallet.sendUserOperation({
    calls: [
      {
        to: (await wallet.getDefaultAddress()).getId() as `0x${string}`,
        value: parseEther(halfBalance.toString()),
        data: '0x'
      },
    ]
  })
  await userOperation.wait()

  console.log(userOperation.status)
}

main();

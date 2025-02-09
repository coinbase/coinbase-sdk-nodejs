import { createWalletClient, http, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { SmartWallet } from './src/coinbase/smart_wallet'
import { Coinbase, Wallet } from './src'
import { mainnet } from 'viem/chains';

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
  const smartWallet = await SmartWallet.create({account: owner})

  // const client = createWalletClient({
  //   chain: mainnet
  //   transport: http()
  // })
  // client.getAddresses()

  // send ETH from wallet to smart wallet so the smart wallet has funds to send back
  const currentBalance = await wallet.getBalance("eth")
  const halfBalance = currentBalance.div(2)

  const transfer = await wallet.createTransfer({
    amount: halfBalance, // send half since we need some funds for gas
    assetId: "eth",
    destination: smartWallet.getAddress(),
  })
  await transfer.wait()

  smartWallet.use({networkId: Coinbase.networks.BaseSepolia })

  // I believe that SCW-Manager should automatically sponsor all base-sepolia user operations so we don't need to have additional funds for gas
  const userOperation = await smartWallet.sendUserOperation({
    calls: [
      {
        to: (await wallet.getDefaultAddress()).getId() as `0x${string}`,
        value: parseEther(halfBalance.toString()),
        data: '0x'
      },
      // {
      //   to: (await wallet.getDefaultAddress()).getId() as `0x${string}`,
      //   abi: myAbi,
      //   functionName: "transfer",
      //   args: [
      //     (await wallet.getDefaultAddress()).getId() as `0x${string}`,
      //     parseEther(halfBalance.toString())
      //   ],
      //   value: parseEther(halfBalance.toString())
      // }
    ]
  })
  await userOperation.wait()

  console.log(userOperation.getStatus())
}

main();

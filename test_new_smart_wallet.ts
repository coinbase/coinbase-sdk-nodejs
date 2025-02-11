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

  // create a smart wallet with viem wallet owner
  const privateKey = generatePrivateKey()
  const owner = privateKeyToAccount(privateKey)
  const smartWallet = await createSmartWallet({account: owner})

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

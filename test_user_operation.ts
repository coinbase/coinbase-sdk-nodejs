import Decimal from "decimal.js";
import { Coinbase, Wallet } from "./src/index";
import { createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from 'viem/chains'
import { createBundlerClient, toCoinbaseSmartAccount } from 'viem/account-abstraction'
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Coinbase.configureFromJson({
  filePath: "~/.apikeys/prod.json",
});

const SMART_WALLET_FACTORY_ABI = [
    {
      inputs: [
        {
          internalType: "address",
          name: "implementation_",
          type: "address"
        }
      ],
      stateMutability: "payable",
      type: "constructor"
    },
    {
      inputs: [],
      name: "OwnerRequired",
      type: "error"
    },
    {
      inputs: [
        {
          internalType: "bytes[]",
          name: "owners",
          type: "bytes[]"
        },
        {
          internalType: "uint256",
          name: "nonce",
          type: "uint256"
        }
      ],
      name: "createAccount",
      outputs: [
        {
          internalType: "contract CoinbaseSmartWallet",
          name: "account",
          type: "address"
        }
      ],
      stateMutability: "payable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes[]",
          name: "owners",
          type: "bytes[]"
        },
        {
          internalType: "uint256",
          name: "nonce",
          type: "uint256"
        }
      ],
      name: "getAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "implementation",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "initCodeHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ] as const;


const SMART_WALLET_ADDRESS = "0x02387c730139512c99f2f67E29062BdA7EfC1A0e"
const WALLET_SEED = "f42156d9eb74f81d2f4f77d0de22a1a6ce1ea68b00f3d7060c2a64d41f75e2a7"
const WALLET_ID = "99e31907-2177-47db-b4a7-23010baf37c5"

async function main() {
  console.log("Starting...");

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  })

  const bundlerClient = createBundlerClient({ 
    client, 
    transport: http("https://api.developer.coinbase.com/rpc/v1/base-sepolia/FBZZ2Xvu1igwpyqpZo9RmnVzaiFmOtoU"),
  }) 

  const wallet = await Wallet.import({
    walletId: WALLET_ID,
    seed: WALLET_SEED,
  });

  const defaultAddress = await wallet.getDefaultAddress()
  const walletAddress = defaultAddress.getId() 
  console.log("Wallet Address (owner and destination)", walletAddress);
  
  // seed the wallet with ETH
  // await wallet.faucet(Coinbase.assets.Eth);
  // await (async function waitForNonZeroBalance() {
  //   let balance: Decimal;
  //   do {
  //     process.stdout.write(".");
  //     await sleep(2000);
  //     balance = await wallet.getBalance(Coinbase.assets.Eth);
  //   } while (balance.isZero());
  // })();

  // const balance = await wallet.getBalance(Coinbase.assets.Eth);
  // console.log("ETH Balance", balance);
  // const balanceToSend = balance.minus(0.001)
  // console.log("ETH Balance to send", balanceToSend.toString());

  // send the ETH to the smart wallet - DOES NOT WORK
  // const tx = await wallet.createTransfer({ // This may be a bug in our ETH transfer where we don't handle extra gas needed for sending to a smart contract
  //   amount: balanceToSend,
  //   assetId: Coinbase.assets.Eth,
  //   destination: SMART_WALLET_ADDRESS,
  //   gasless: false,
  // });
  // await tx.wait();
  // console.log(JSON.stringify(tx, null, 2));

  // get wallet address private key to construct an account
  const walletPrivateKey = defaultAddress.export()

  const account = await toCoinbaseSmartAccount({
    client,
    owners: [privateKeyToAccount(walletPrivateKey as `0x${string}`)]
  })

  console.log("wallet private key", walletPrivateKey)
  console.log("account address", account.address)

  // transfer the ETH from the smart wallet back to the wallet, leveraging user operation with paymaster
  const hash = await bundlerClient.sendUserOperation({
    account, 
    calls: [{ 
      to: walletAddress as `0x${string}`, 
      value: parseEther('0.001') // wallet currently contains 0.045
    }]
  })
   
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
  console.log("receipt entry point", receipt.entryPoint)
  console.log("receipt user operation hash", receipt.userOpHash)
  
  console.log("Done!");
}

main();


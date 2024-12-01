import Decimal from "decimal.js";
import { Coinbase, Wallet } from "./src/index";
import { ethers } from "ethers";

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

const SMART_WALLET_FACTORY_ADDRESS = "0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a" 

async function main() {
  console.log("Starting...");

  const wallet = await Wallet.create(); // base-sepolia
  await wallet.faucet();

  await (async function waitForNonZeroBalance() {
    let balance: Decimal;
    do {
      process.stdout.write(".");
      await sleep(2000);
      balance = await wallet.getBalance(Coinbase.assets.Eth);
    } while (balance.isZero());
  })();
  const balance = await wallet.getBalance(Coinbase.assets.Eth);
  console.log(`Balance: ${balance}`);

  const defaultAddress = (await wallet.getDefaultAddress()).getId();
  console.log(`Default address: ${defaultAddress}`);

  const encodedOwners = [ethers.AbiCoder.defaultAbiCoder().encode(['address'], [defaultAddress])];
  console.log("encodedOwners", encodedOwners);

  const tx = await wallet.invokeContract({
    contractAddress: SMART_WALLET_FACTORY_ADDRESS,
    abi: SMART_WALLET_FACTORY_ABI,
    method: "createAccount",
    args: {
      owners: encodedOwners,
      nonce: "0",
    },
  });

  await tx.wait();
  console.log(JSON.stringify(tx, null, 2));

  console.log("Done!");
}

main();


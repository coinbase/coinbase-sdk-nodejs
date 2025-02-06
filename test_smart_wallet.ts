import { createPublicClient, http, parseEther } from 'viem'
import { createBundlerClient, toCoinbaseSmartAccount } from 'viem/account-abstraction'
import { mainnet } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts' 
import { SmartWallet } from './src/coinbase/smart_wallet'
import { Wallet } from './src'

const myAbi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pureInt16",
    inputs: [],
    outputs: [{ name: "", type: "int16", internalType: "int16" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint16",
    inputs: [],
    outputs: [{ name: "", type: "uint16", internalType: "uint16" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint256",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "pure",
  },
  {
    inputs: [],
    stateMutability: "pure",
    type: "function",
    name: "pureInt256",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
  },
  {
    inputs: [],
    stateMutability: "pure",
    type: "function",
    name: "pureUint128",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
  },
  {
    inputs: [],
    stateMutability: "pure",
    type: "function",
    name: "pureUint64",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
  },
  {
    inputs: [],
    stateMutability: "pure",
    type: "function",
    name: "pureUint32",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
  },
  {
    inputs: [{ internalType: "uint256", name: "y", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "uint256", name: "z", type: "uint256" }],
    name: "exampleFunction",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureArray",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureBool",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureBytes",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureBytes1",
    outputs: [{ internalType: "bytes1", name: "", type: "bytes1" }],
    stateMutability: "pure",
    type: "function",
  },
  // ... (other pureBytes functions)
  {
    inputs: [],
    name: "pureNestedStruct",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "a", type: "uint256" },
          {
            components: [
              {
                components: [{ internalType: "uint256[]", name: "a", type: "uint256[]" }],
                internalType: "struct TestAllReadTypes.ArrayData",
                name: "nestedArray",
                type: "tuple",
              },
              { internalType: "uint256", name: "a", type: "uint256" },
            ],
            internalType: "struct TestAllReadTypes.NestedData",
            name: "nestedFields",
            type: "tuple",
          },
        ],
        internalType: "struct TestAllReadTypes.ExampleStruct",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureString",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureTuple",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "pureTupleMixedTypes",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  // ... (other pure functions)
  {
    inputs: [],
    name: "returnFunction",
    outputs: [
      {
        internalType: "function (uint256) external returns (bool)",
        name: "",
        type: "function",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "viewUint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "x",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "x", type: "address" }],
    name: "overload",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { name: "x", type: "uint256" },
      { name: "y", type: "uint256" },
    ],
    name: "overload",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ name: "x", type: "uint256" }],
    name: "overload",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "overload",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    type: "function",
    name: "pureNestedStruct",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct TestAllReadTypes.ExampleStruct",
        components: [
          { name: "a", type: "uint256", internalType: "uint256" },
          {
            name: "nestedFields",
            type: "tuple",
            internalType: "struct TestAllReadTypes.NestedData",
            components: [
              {
                name: "nestedArray",
                type: "tuple",
                internalType: "struct TestAllReadTypes.ArrayData",
                components: [{ name: "a", type: "uint256[]", internalType: "uint256[]" }],
              },
              { name: "a", type: "uint256", internalType: "uint256" },
            ],
          },
        ],
      },
    ],
    stateMutability: "pure",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;





async function main() {
  // create a wallet
  const wallet = await Wallet.create();

  // faucet it
  const faucet = await wallet.faucet();

  // create a smart wallet with viem wallet owner
  const privateKey = generatePrivateKey()
  const owner = privateKeyToAccount(privateKey)
  const smartWallet = await SmartWallet.create({account: owner})

  // send ETH from wallet to smart wallet so the smart wallet has funds to send back
  const currentBalance = await wallet.getBalance("eth")
  const halfBalance = currentBalance.div(2)

  const transfer = await wallet.createTransfer({
    amount: halfBalance, // send half since we need some funds for gas
    assetId: "eth",
    destination: smartWallet.getAddress(),
  })
  await transfer.wait()

  // I believe that SCW-Manager should automatically sponsor all base-sepolia user operations so we don't need to have additional funds for gas
  const userOperation = await smartWallet.sendUserOperation({
    calls: [{
      to: '0xcb98643b8786950F0461f3B0edf99D88F274574D',
      value: parseEther(halfBalance.toString()),
      data: '0x'
    }
    ]
  })
  await userOperation.wait()

  console.log(userOperation.getStatus())
}

main();
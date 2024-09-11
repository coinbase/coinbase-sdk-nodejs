import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { encodeFunctionData, namehash } from "viem";
import os from "os";

const l2ResolverABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "address", name: "a", type: "address" },
    ],
    name: "setAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "string", name: "newName", type: "string" },
    ],
    name: "setName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const registrarABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "resolver",
            type: "address",
          },
          {
            internalType: "bytes[]",
            name: "data",
            type: "bytes[]",
          },
          {
            internalType: "bool",
            name: "reverseRecord",
            type: "bool",
          },
        ],
        internalType: "struct RegistrarController.RegisterRequest",
        name: "request",
        type: "tuple",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const BaseNamesRegistrarControllerAddress = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

function createRegisterContractMethodArgs(baseName, addressId) {
  const addressData = encodeFunctionData({
    l2ResolverABI,
    functionName: "setAddr",
    args: [namehash(baseName), addressId],
  });
  const nameData = encodeFunctionData({
    l2ResolverABI,
    functionName: "setName",
    args: [namehash(baseName), baseName],
  });

  const registerArgs = {
    request: [
      baseName,
      addressId,
      "31557600",
      BaseNamesRegistrarControllerAddress,
      [addressData, nameData],
      true,
    ],
  };
  console.log(`Register contract method arguments constructed: `, registerArgs);

  return registerArgs;
}

async function registerBaseName(wallet, registerArgs) {
  try {
    const contractInvocation = await wallet.invokeContract({
      contractAddress: BaseNamesRegistrarControllerAddress,
      method: "register",
      abi: registrarABI,
      args: registerArgs,
      amount: 0.002,
      assetId: Coinbase.assets.Eth,
    });

    await contractInvocation.wait();

    console.log(`Successfully registered Basename ${registerArgs[0]} for wallet: `, wallet);
  } catch (error) {
    console.error(`Error registering a Basename for ${wallet}: `, error);
  }
}

async () => {
  try {
    // Manage CDP API Key for Coinbase SDK.
    // Configure location to CDP API Key.
    Coinbase.configureFromJson({
      filePath: `${os.homedir()}/Downloads/cdp_api_key.json`,
    });

    const baseName = "aiwallet2.base.eth";
    const wallet = await Wallet.create({ networkId: Coinbase.networks.BaseMainnet });
    const defaultAddress = await wallet.getDefaultAddress();
    const registerArgs = createRegisterContractMethodArgs(baseName, defaultAddress.getId());
    await registerBaseName(wallet, registerArgs);
  } catch (error) {
    console.error(`Error in registering a Basename for my wallet: `, error);
  }
};

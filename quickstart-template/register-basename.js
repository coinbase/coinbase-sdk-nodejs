import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { encodeFunctionData, namehash } from "viem";
import os from "os";

// Relevant ABI for L2 Resolver Contract.
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

// Relevant ABI for Basenames Registrar Controller Contract.
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

// Basenames Registrar Controller Contract Address.
const BaseNamesRegistrarControllerAddress = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";

// L2 Resolver Contract Address.
const L2ResolverAddress = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

// Create register contract method arguments.
function createRegisterContractMethodArgs(baseName, addressId) {
  const addressData = encodeFunctionData({
    abi: l2ResolverABI,
    functionName: "setAddr",
    args: [namehash(baseName), addressId],
  });
  const nameData = encodeFunctionData({
    abi: l2ResolverABI,
    functionName: "setName",
    args: [namehash(baseName), baseName],
  });

  const registerArgs = {
    request: [
      baseName.replace(/\.base\.eth$/, ""),
      addressId,
      "31557600",
      L2ResolverAddress,
      [addressData, nameData],
      true,
    ],
  };
  console.log(`Register contract method arguments constructed: `, registerArgs);

  return registerArgs;
}

// Register a Basename for the given Wallet.
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

// Fetch a funded Wallet and load its Seed.
async function fetchWalletAndLoadSeed(walletId, seedFilePath) {
  try {
    const wallet = await Wallet.fetch(walletId);
    await wallet.loadSeed(seedFilePath);

    console.log(`Successfully loaded funded wallet: `, wallet);
    return wallet;
  } catch (error) {
    console.error(
      `Error loading funded wallet ${walletId} from seed file ${seedFilePath}: `,
      error,
    );
  }
}

(async () => {
  try {
    const { BASE_NAME, WALLET_ID, SEED_FILE_PATH } = process.env;

    // Manage CDP API Key for Coinbase SDK.
    // Configure location to CDP API Key.
    Coinbase.configureFromJson({
      filePath: `${os.homedir()}/Downloads/cdp_api_key.json`,
    });

    // Fetch funded Wallet.
    const wallet = await fetchWalletAndLoadSeed(WALLET_ID, SEED_FILE_PATH);
    const defaultAddress = await wallet.getDefaultAddress();

    // Register Basename.
    const registerArgs = createRegisterContractMethodArgs(BASE_NAME, defaultAddress.getId());
    await registerBaseName(wallet, registerArgs);
  } catch (error) {
    console.error(`Error in registering a Basename for my wallet: `, error);
  }
})();
https://github.com/ElementsProject/elements.git

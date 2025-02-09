import { createWalletClient, http, parseEther } from 'viem';
import { Coinbase, hashMessage, hashTypedDataMessage, PayloadSignature, toLocalAccount, Wallet } from './src';
import { mainnet } from 'viem/chains';

Coinbase.configureFromJson({
  filePath: "~/.apikeys/prod.json",
});

const myAbi = [
  {
    inputs: [
      {
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
] as const;

async function main() {
  const wallet = await Wallet.create();
  const walletAddress = await wallet.getDefaultAddress();

  const localAccount = toLocalAccount(walletAddress);
  const msg = "Hey Team"
  const signature = await localAccount.signMessage({message: msg});
  console.log(signature);

  const walletClient = await createWalletClient({
    account: localAccount,
    chain: mainnet,
    transport: http(),
  });

  walletClient.writeContract({
    address: walletAddress.getId() as `0x${string}`,
    abi: myAbi,
    functionName: "transfer",
    args: [123n]
  })



  // sign with normal wallet address way
  const hashedMsg = hashMessage(msg);
  // sign with normal wallet address way
  const hashedMsg = hashMessage(msg);
  const signature2 = await walletAddress.createPayloadSignature(hashedMsg);
  console.log(signature2.getSignature());

  const domain = {
    name: "MyDapp",
    version: "1",
    chainId: 1,
    verifyingContract: walletAddress.getId() as `0x${string}`,
  } as const;
  
  const types = {
    MyType: [
      { name: "sender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  };
  
  const typedDataMessage = {
    sender: walletAddress.getId(),
    amount: 1000,
  };

  const signatureTypedData = await localAccount.signTypedData({
    domain,
    types,
    primaryType: "MyType",
    message: typedDataMessage,
  });
  console.log(signatureTypedData);
  
  const hashedTypedData = hashTypedDataMessage(
    domain,
    types,
    typedDataMessage,
  );
  
  let payloadSignature: PayloadSignature = await walletAddress.createPayloadSignature(hashedTypedData);
  payloadSignature = await payloadSignature.wait();
  console.log(payloadSignature.getSignature());
}

main();

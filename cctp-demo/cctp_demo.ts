import Decimal from "decimal.js";
import { Coinbase, Wallet } from "../src/index";
import * as fs from 'fs';
import { createPublicClient, decodeAbiParameters, http } from 'viem';
import { base } from 'viem/chains'
import { keccak256, toBytes } from 'viem'

Coinbase.configureFromJson({filePath: "~/.apikeys/prod.json"});

async function createWallets() {

    const baseWallet = await Wallet.create({
        networkId: Coinbase.networks.BaseMainnet
    });
    
    const arbitrumWallet = await Wallet.create({
        networkId: Coinbase.networks.ArbitrumMainnet
    });

    return {
        baseWallet,
        arbitrumWallet
    };
}

async function saveWalletsToFile(baseWallet: Wallet, arbitrumWallet: Wallet) {
    baseWallet.saveSeed("wallets.json");
    arbitrumWallet.saveSeed("wallets.json");
}

async function loadWalletsFromFile() {
    const wallets = await Wallet.loadWalletsFromSeedFile("wallets.json");
    return wallets;
}
// https://developers.circle.com/stablecoins/evm-smart-contracts contains the contract addresses 
// TokenMessenger for base is: 0x1682Ae6375C4E4A97e4B583BC394c861A46D8962
// Messagetransmitter for arbitrum is: 0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca
// USDC base contract address is: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
function padAddress(address: string) {
    // Remove '0x' if present
    address = address.replace(/^0x/, '');
    // Pad to 64 characters (32 bytes)
    return '0x' + address.padStart(64, '0');
}

async function getTransactionReceipt(txHash: string) {
    const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      })
    const receipt = await publicClient.getTransactionReceipt({ 
        hash: txHash as `0x${string}`
      })
    return receipt;
}


async function bridgeUSDC(baseWallet: Wallet, arbitrumWallet: Wallet, usdcAmount: Decimal) {
    const baseUSDCBalance = await baseWallet.getBalance("usdc");
    const arbitrumUSDCBalance = await arbitrumWallet.getBalance("usdc");

    // read TokenMessenger.json ABI
    const tokenMessengerAbi = JSON.parse(fs.readFileSync("TokenMessenger.json", "utf8"));
    console.log("Base USDC initial balance:", baseUSDCBalance);
    console.log("Arbitrum USDC initial balance:", arbitrumUSDCBalance);

    // pad the recipient address
    const arbitrumRecipientAddress = padAddress((await arbitrumWallet.getDefaultAddress()).getId());
    console.log("Arbitrum recipient address:", arbitrumRecipientAddress);
    
    // step 1 - approve  TokenMessenger as the spender on base
    const approveTx = await baseWallet.invokeContract({
        contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        method: "approve",
        args: {
            spender: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
            value: usdcAmount.toString()
        },
    });
    await approveTx.wait();
    console.log("Approve transaction completed: ", approveTx.getTransactionHash());
    
    // step 2 - call depositForBurn
    const depositTx = await baseWallet.invokeContract({
        contractAddress: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
        method: "depositForBurn",
        args: {
            amount: usdcAmount.toString(), // uint256 as string
            destinationDomain: "3", // uint32 as string
            mintRecipient: arbitrumRecipientAddress, // already padded bytes32 as hex string
            burnToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // address as hex string
        },
        abi: tokenMessengerAbi
    });
    await depositTx.wait();
    console.log("Deposit transaction completed: ", depositTx.getTransactionHash());
    
    // step 3 - get the messageHash from the transaction receipt logs
    const transactionReceipt = await getTransactionReceipt(depositTx.getTransactionHash()!);
    const eventTopic = keccak256(toBytes('MessageSent(bytes)'));
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic);
    if (!log) {
        throw new Error('MessageSent event not found in transaction logs');
    }
    const messageBytes = decodeAbiParameters([{ type: 'bytes' }], log.data)[0];
    const messageHash = keccak256(messageBytes)
    console.log("Message hash:", messageHash);

    // step 4 - wait for attestation on the message
    let attestationResponse: { status: string, signature?: string } = { status: 'pending' }
    while (attestationResponse.status != 'complete') {
    const response = await fetch(
        `https://iris-api.circle.com/attestations/${messageHash}`,
    )
    attestationResponse = await response.json()
    await new Promise((r) => setTimeout(r, 2000))
    }

    const attestationSignature = attestationResponse.signature!;

    // step 5 - call receiveMessage on the arbitrum wallet MessageTransmitter
    const receiveMessageTx = await arbitrumWallet.invokeContract({
        contractAddress: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
        method: "receiveMessage",
        args: {
            message: messageHash,
            signature: attestationSignature
        },
    });
    await receiveMessageTx.wait();
    console.log("Receive message transaction completed: ", receiveMessageTx.getTransactionHash());

    // final balances
    const finalBaseUSDCBalance = await baseWallet.getBalance("usdc");
    const finalArbitrumUSDCBalance = await arbitrumWallet.getBalance("usdc");
    console.log("Base USDC final balance:", finalBaseUSDCBalance);
    console.log("Arbitrum USDC final balance:", finalArbitrumUSDCBalance);
}

async function main() {
    let wallets: Wallet[];
    // check if wallets.json exists
    if (fs.existsSync("wallets.json")) {
        console.log("Loading wallets from file");
        wallets = await loadWalletsFromFile();
        console.log("Wallets loaded from file");
    } else {
        console.log("Creating new wallets");
        const { baseWallet, arbitrumWallet } = await createWallets();
        wallets = [baseWallet, arbitrumWallet];
        await saveWalletsToFile(baseWallet, arbitrumWallet);
    }

    const baseWalletAddress = (await wallets[0].getDefaultAddress()).getId();
    const arbitrumWalletAddress = (await wallets[1].getDefaultAddress()).getId();

    const baseBalance = await wallets[0].getBalance("eth");
    const arbitrumBalance = await wallets[1].getBalance("eth");

    const baseUSDCBalance = await wallets[0].getBalance("usdc");

    if (baseUSDCBalance.eq(new Decimal(0))) {
        console.log("Base Wallet USDC balance is 0, fund the wallet to run this demo");
        console.log("Base Wallet address: ", baseWalletAddress);
        return;
    }

    if (baseBalance.lt(new Decimal(0.001)) && arbitrumBalance.lt(new Decimal(0.001))) {
        console.log("Base Wallet balance and Arbitrum Wallet eth balance are less than 0.001, fund the wallets to run this demo");
        console.log("Base Wallet address: ", baseWalletAddress);
        console.log("Arbitrum Wallet address: ", arbitrumWalletAddress);
        return;
    } else if (baseBalance.lt(new Decimal(0.0001))) {
        console.log("Base Wallet balance is less than 0.0001, fund the wallet to run this demo");
        console.log("Base Wallet address: ", baseWalletAddress);
        return;
    } else if (arbitrumBalance.lt(new Decimal(0.0001))) {
        console.log("Arbitrum Wallet balance is less than 0.0001, fund the wallet to run this demo");
        console.log("Arbitrum Wallet address: ", arbitrumWalletAddress);
        return;
    }

    await bridgeUSDC(wallets[0], wallets[1], new Decimal(1)); // 1 wei of USDC
}

main();

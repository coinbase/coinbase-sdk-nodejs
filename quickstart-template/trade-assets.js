import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

// Create a Wallet on base-mainnet to trade assets with.
let wallet = await Wallet.create({ networkId: Coinbase.networks.BaseMainnet });

/*
 * Fund the Wallet's default Address with ETH from an external source.
 * Trade 0.00001 ETH to USDC.
 */
let trade = await wallet.createTrade({
  amount: 0.00001,
  fromAssetId: Coinbase.assets.Eth,
  toAssetId: Coinbase.assets.Usdc,
});

// Wait for the trade to complete or fail on-chain.
await trade.wait();

console.log(`Trade successfully completed: `, trade.toString());

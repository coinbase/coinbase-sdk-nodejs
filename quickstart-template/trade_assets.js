import { Coinbase } from "@coinbase/coinbase-sdk";

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
let user = await coinbase.getDefaultUser();

// Create a Wallet on base-mainnet to trade assets with.
let wallet = await user.createWallet({ networkId: Coinbase.networks.BaseMainnet });

/*
 * Fund the Wallet's default Address with ETH from an external source.
 * Trade 0.00001 ETH to USDC.
 */
let trade = await wallet.createTrade(0.00001, Coinbase.assets.Eth, Coinbase.assets.Usdc);
console.log(`Trade successfully completed: `, trade.toString());

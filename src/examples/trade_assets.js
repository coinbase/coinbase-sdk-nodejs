const { Coinbase } = require("@coinbase/coinbase-sdk");

async function tradeAssets() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

  // Create a wallet on base-mainnet to trade assets with.
  const wallet = await Wallet.create({ networkId: Coinbase.networks.BaseMainnet });

  // Fund the wallet's default address with ETH from an external source.
  // Trade 0.00001 ETH to USDC
  const trade = await wallet.createTrade({
    amount: 0.00001,
    fromAssetId: Coinbase.assets.Eth,
    toAssetId: Coinbase.assets.Usdc,
  });
  console.log(`Trade successfully completed: `, trade.toString());
}

tradeAssets();

const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
let mainnetWallet;

coinbase
  .getDefaultUser()
  .then(user => Wallet.create({ networkId: Coinbase.networks.BaseMainnet }))
  .then(wallet => {
    console.log(`Wallet successfully created: ${mainnetWallet}`);
    console.log(wallet);
    /*
     * Fund the wallet's default address with ETH from an external source.
     * Trade 0.00001 ETH to USDC
     */
    return wallet.createTrade(0.00001, Coinbase.assets.Eth, Coinbase.assets.Usdc);
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });

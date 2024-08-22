const { Coinbase } = require("@coinbase/coinbase-sdk");

async function createWallet(networkId = Coinbase.networks.BaseSepolia) {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  console.log("Coinbase SDK has been successfully configured with CDP API key.");

  // Create a Wallet on specified network.
  const wallet = await Wallet.create({ networkId });
  console.log(wallet.toString());

  // Wallets come with a single default address, accessible via getDefaultAddress:
  const address = await wallet.getDefaultAddress();
  console.log(address.toString());
}

createWallet();
createWallet(Coinbase.networks.BaseMainnet);

const { Coinbase } = require("@coinbase/coinbase-sdk");

async function createWallet() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  console.log("Coinbase SDK has been successfully configured with CDP API key.");

  const user = await coinbase.getDefaultUser();
  console.log(user);

  // Create a Wallet for the user
  const wallet = await user.createWallet();

  // Wallets come with a single default address, accessible via getDefaultAddress:
  const address = wallet.getDefaultAddress();
  console.log(address.toString());
}

(async () => {
  try {
    await createWallet();
  } catch (error) {
    console.error("Error during wallet creation", error);
  }
})();

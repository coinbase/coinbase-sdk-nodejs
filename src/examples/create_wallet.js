const { Coinbase } = require("@coinbase/coinbase-sdk");

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
console.log("Coinbase SDK has been successfully configured with CDP API key.");

coinbase
  .getDefaultUser()
  .then(user => {
    // Create a Wallet for the user
    return user.createWallet();
  })
  .then(wallet => {
    // Wallets come with a single default address, accessible via `getDefaultAddress`:
    return wallet.getDefaultAddress();
  })
  .then(address => {
    console.log(address);
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });

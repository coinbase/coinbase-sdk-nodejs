const { Coinbase } = require("@coinbase/coinbase-sdk");

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

coinbase
  .getDefaultUser()
  .then(user => {
    return user.createWallet();
  })
  .then(wallet => {
    // Fund the wallet with a faucet transaction.
    return wallet.faucet();
  })
  .then(faucetTransaction => {
    console.log(`Faucet transaction successfully completed: ${faucetTransaction}`);
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });

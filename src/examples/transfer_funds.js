const { Coinbase } = require("@coinbase/coinbase-sdk");

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
let userObject;

coinbase
  .getDefaultUser()
  .then(user => {
    userObject = user;
    return user.createWallet();
  })
  .then(wallet => {
    return userObject.createWallet().then(anotherWallet => {
      console.log(`Wallet successfully created: ${anotherWallet}`);

      /*
       * Fund the wallet's default address with ETH from an external source.
       * Transfer 0.00001 ETH out of the wallet to another wallet.
       */
      return wallet.createTransfer(0.00001, Coinbase.assets.Eth, anotherWallet);
    });
  })
  .then(transfer => {
    console.log(`Transfer successfully completed: ${transfer}`);
  })
  .catch(error => {
    console.error("An error occurred:", error);
  });

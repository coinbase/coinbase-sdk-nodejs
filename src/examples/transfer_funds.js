const { Coinbase } = require("@coinbase/coinbase-sdk");

async function transferFunds() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  const user = await coinbase.getDefaultUser();
  const wallet = await user.createWallet();

  // Create a new Wallet to transfer funds to.
  const anotherWallet = await user.createWallet();

  // Then, we can transfer 0.00001 ETH out of the Wallet to another Wallet.
  // The wallet object should have funds to create a transfer.
  const transfer = await wallet.createTransfer({
    amount: 0.00001,
    assetId: Coinbase.assets.Eth,
    destination: anotherWallet,
  });
  console.log(`Transfer successfully completed: `, transfer);
}

transferFunds();

const { Coinbase } = require("@coinbase/coinbase-sdk");

async function fundWallet() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  const user = await coinbase.getDefaultUser();
  const wallet = await user.createWallet();

  // Fund the wallet with a faucet transaction.
  const faucetTransaction = await wallet.faucet();
  console.log(`Faucet transaction successfully completed: ${faucetTransaction}`);
}

fundWallet();

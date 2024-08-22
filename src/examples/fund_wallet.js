const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");

async function fundWallet() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  const wallet = await Wallet.create({ networkId: Coinbase.networks.BaseSepolia });

  // Fund the wallet with a faucet transaction.
  const faucetTransaction = await wallet.faucet();
  console.log(`Faucet transaction successfully completed: `, faucetTransaction.toString());
}

fundWallet();

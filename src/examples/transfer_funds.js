const { Coinbase } = require("@coinbase/coinbase-sdk");

async function transferFunds() {
  const coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
  const networkId = Coinbase.networks.BaseSepolia;

  // Create a source Wallet.
  const wallet = await Wallet.create({ networkId });

  // Out-of-band, send funds to the source Wallet (e.g. from a faucet: `await wallet.faucet()`).

  // Create a new Wallet to transfer funds to.
  const anotherWallet = await user.createWallet({ networkId });

  // Then, we can transfer 0.00001 ETH out of the Wallet to another Wallet.
  // The wallet object should have funds to create a transfer.
  const transfer = await wallet.createTransfer({
    amount: 0.00001,
    assetId: Coinbase.assets.Eth,
    destination: anotherWallet,
  });

  // Wait for the transfer to complete or fail on-chain.
  await transfer.wait();

  console.log(`Transfer successfully completed: `, transfer.toString());
}

transferFunds();

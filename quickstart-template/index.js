import { Coinbase } from "@coinbase/coinbase-sdk";

let coinbase = Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });
let user = await coinbase.getDefaultUser();

// Create a Wallet for the User.
let wallet = await user.createWallet();
console.log(`Wallet successfully created: `, wallet.toString());

// Wallets come with a single default Address, accessible via getDefaultAddress:
let address = wallet.getDefaultAddress();
console.log(`Default address for the wallet: `, address.toString());

const faucetTransaction = await wallet.faucet();
console.log(`Faucet transaction successfully completed: `, faucetTransaction.toString());

let anotherWallet = await user.createWallet();
console.log(`Second Wallet successfully created: `, anotherWallet.toString());

const transfer = await wallet.createTransfer({
  amount: 0.00001,
  assetId: Coinbase.assets.Eth,
  destination: anotherWallet,
});

console.log(`Transfer successfully completed: `, transfer.toString());

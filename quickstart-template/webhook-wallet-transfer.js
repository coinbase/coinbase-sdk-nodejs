import { Coinbase, Wallet, Webhook } from "@coinbase/coinbase-sdk";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

// Create wallets for transferring funds between each other
let myWallet = await Wallet.create();
let anotherWallet = await Wallet.create();

console.log('Wallets created! ...');

// Wallets come with a single default Address, accessible via getDefaultAddress()
let myWalletAddress = await myWallet.getDefaultAddress();
let anotherWalletAddress = await anotherWallet.getDefaultAddress();

// Get both wallet addresses
const myWalletAddressId = myWalletAddress.getId();
const anotherWalletAddressId = anotherWalletAddress.getId();

console.log('Wallets addresses fetched! ...');

// Faucet wallet to add some funds
await myWallet.faucet(Coinbase.assets.Usdc); // USDC funds to actual transaction
await myWallet.faucet(Coinbase.assets.Eth);  // ETH funds for transfer gas fee (USDC gas fee is charged in ETH)

console.log('Funds added to myWallet! ...');
console.log('Funds available on myWallet:', (await myWallet.listBalances()).toString());

// Let's create a webhook that will be triggered when a transfer happens between the two wallets created above
// Don't forget to replace the notificationUri and signatureHeader
let webhook = await Webhook.create({
  networkId: 'base-sepolia', // Listening on sepolia testnet transactions
  notificationUri: 'https://<your_webhook_uri>/callback', // Your webhook address
  eventType: 'erc20_transfer',
  eventFilters: [{ 
    // Webhook will only be triggered when these filter criteria are met
    from_address: myWalletAddressId,
    to_address: anotherWalletAddressId,
  }],
});

console.log(`Webhook successfully created: `, webhook.toString());

// You can fetch all the information used on webhook creation using getters functions:
console.log(`Webhook event filters: `, webhook.getEventFilters());
console.log(`Webhook event type: `, webhook.getEventType());
console.log(`Webhook network id: `, webhook.getNetworkId());
console.log(`Webhook notification URI: `, webhook.getNotificationURI());

// Create transfer from myWallet to anotherWallet
const transfer = await myWallet.createTransfer({
  amount: 0.0001,
  assetId: Coinbase.assets.Usdc,
  destination: anotherWallet,
  // gasless: true, // for USDC, you can also add gasless flag, so you don't need to add ETH funds for paying for gas fees
});

// Wait for the transfer to complete or fail on-chain
await transfer.wait();
console.log(`Transfer successfully completed: `, transfer.toString());

console.log('------------------------------------------------------------------------------------------------------------------');
console.log('Be aware that after transfer is successfully completed, it may take a few minutes for the webhook to be triggered.');
console.log('------------------------------------------------------------------------------------------------------------------');

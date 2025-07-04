import { Coinbase, Wallet, Webhook } from "@coinbase/coinbase-sdk";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

// Change this to your webhook URL
const webhookNotificationUri = "<YOUR_NOTIFICATION_URL>";

(async function () {
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please make sure you have replaced the webhook notificationUri on the code.");
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please press Enter to continue...");
  await waitForEnter();

  // Create wallets for transferring funds between each other
  let myWallet = await Wallet.create();
  let anotherWallet = await Wallet.create();

  console.log("Wallets created! ...");

  // Wallets come with a single default Address, accessible via getDefaultAddress()
  let myWalletAddress = await myWallet.getDefaultAddress();
  let anotherWalletAddress = await anotherWallet.getDefaultAddress();

  // Get both wallet addresses
  const myWalletAddressId = myWalletAddress.getId();
  const anotherWalletAddressId = anotherWalletAddress.getId();

  console.log("Wallets addresses fetched! ...");

  try {
    // Faucet wallet to add some funds
    const usdcFaucetTx = await myWallet.faucet(Coinbase.assets.Usdc); // USDC funds to actual transaction
    const ethFaucetTx = await myWallet.faucet(Coinbase.assets.Eth); // ETH funds for transfer gas fee (USDC gas fee is charged in ETH)

    // Wait for the faucet transactions to complete or fail on-chain.
    await usdcFaucetTx.wait();
    await ethFaucetTx.wait();

    console.log("Funds added to myWallet! ...");
  } catch (e) {
    console.log(
      "------------------------------------------------------------------------------------------------------------------",
    );
    console.log("We're not able to add funds to the wallet we just created.");

    console.log(`Please add some funds to wallet: ${myWalletAddressId}`);
    console.log("Please press Enter after you added the funds to continue...");
    await waitForEnter();
  }

  console.log("Funds available on myWallet:", (await myWallet.listBalances()).toString());

  // Let's create a webhook that will be triggered when a transfer happens between the two wallets created above
  // Don't forget to replace the notificationUri and signatureHeader
  let webhook = await Webhook.create({
    networkId: Coinbase.networks.BaseSepolia, // Listening on sepolia testnet transactions
    notificationUri: webhookNotificationUri, // Your webhook address
    eventType: "erc20_transfer",
    eventFilters: [
      {
        // Webhook will only be triggered when these filter criteria are met
        from_address: myWalletAddressId,
        to_address: anotherWalletAddressId,
      },
    ],
  });

  console.log(`\nWebhook successfully created: `, webhook.toString());

  // You can fetch all the information used on webhook creation using getters functions:
  console.log(`\nWebhook event filters: `, webhook.getEventFilters());
  console.log(`Webhook event type: `, webhook.getEventType());
  console.log(`Webhook network id: `, webhook.getNetworkId());
  console.log(`Webhook notification URI: `, webhook.getNotificationURI());

  console.log(
    "\n\n------------------------------------------------------------------------------------------------------------------",
  );
  console.log(`Before transferring, please make sure your webhook is listening for requests.`);
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
  console.log("Please press Enter to continue...");
  await waitForEnter();

  console.log("Creating transfer...");
  // Create transfer from myWallet to anotherWallet
  const transfer = await myWallet.createTransfer({
    amount: 0.0001,
    assetId: Coinbase.assets.Usdc,
    destination: anotherWallet,
    gasless: true, // for USDC, you can also add gasless flag, so you don't need to add ETH funds for paying for gas fees
  });

  // Wait for the transfer to complete or fail on-chain
  await transfer.wait();
  console.log(`Transfer successfully completed: `, transfer.toString());

  console.log(
    "\n\n------------------------------------------------------------------------------------------------------------------",
  );
  console.log(
    "Be aware that after transfer is successfully completed, it may take a few minutes for the webhook to be triggered.",
  );
  console.log(
    "------------------------------------------------------------------------------------------------------------------",
  );
})().then(process.exit);

// --------------------------------------------------------------------------------------------------------------------------------
function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.on("data", function (chunk) {
      if (chunk[0] === 10) {
        resolve();
      }
    });
  });
}

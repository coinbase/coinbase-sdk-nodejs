import "dotenv/config";
import { Coinbase, Webhook, Wallet } from "@coinbase/coinbase-sdk";
import fs from "fs";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "/Users/jairdarosajunior/Downloads/cdp_api_key.json" });
const webhookNotificationUri = process.env.WEBHOOK_NOTIFICATION_URL;

(async function () {
  if (!webhookNotificationUri) {
    console.log("WEBHOOK_NOTIFICATION_URL is missing from env file.");
    return;
  }
  const seedPath = "wallet_saved_seeds.json";

  let myWallet;
  let anotherWallet = await Wallet.create();

  // If Wallet exists, load
  if (fs.existsSync(seedPath)) {
    console.log("🔄 Wallet exists, re-instantiating...");
    const seedData = transformConfig(seedPath);
    myWallet = await Wallet.import(seedData);
    console.log("✅ Wallet re-instantiated!");
  }
  // Create Wallet
  else {
    myWallet = await Wallet.create();
    const saveSeed = myWallet.saveSeedToFile(seedPath);
    console.log("✅ Seed saved: ", saveSeed);
  }

  const balance = await myWallet.getBalance(Coinbase.assets.Usdc);
  console.log(`💰 Wallet USDC balance:`, balance);
  if (balance <= 0) {
    // If wallet doesn't have funds we need to add funds to it
    const faucetTx = await myWallet.faucet(Coinbase.assets.Usdc);

    // Wait for the faucet transaction to confirm.
    await faucetTx.wait();

    console.log("✅ Funds added!");

    // Sometimes funds take a few seconds to be available on the wallet, so lets wait 5 secs
    await sleep(5000);
  }

  // Now use below code to get wallets addresses so we can use it for adding it to the webhook filter.
  let myWalletAddress = await myWallet.getDefaultAddress();
  const myWalletAddressId = myWalletAddress.getId();

  console.log("💳 myWallet address: ", myWalletAddressId);

  const webhooks = await Webhook.list();
  let shouldCreateWebhook = !webhookAlreadyExists(webhooks);

  if (shouldCreateWebhook) {
    console.log("🔄 Creating webhook...");
    await Webhook.create({
      networkId: Coinbase.networks.BaseSepolia,
      notificationUri: webhookNotificationUri,
      eventType: "wallet_activity",
      eventTypeFilter: {
        addresses: [myWalletAddressId],
      },
    });
    console.log("✅ Webhook created!");
  } else {
    console.log("⏩ Skipping Webhook creation...");
  }

  // For testing this above example, let's now create a transfer between both wallets:
  // Create transfer from myWallet to anotherWallet
  const transfer = await myWallet.createTransfer({
    amount: 0.0001,
    assetId: Coinbase.assets.Usdc,
    destination: anotherWallet,
    gasless: true, // for USDC, you can add gasless flag, so you don't need to add ETH funds for paying for gas fees
  });

  // Wait for the transfer to complete or fail on-chain
  await transfer.wait({
    intervalSeconds: 1, // check for transfer completion each 1 second
    timeoutSeconds: 30, // keep checking for 30 seconds
  });
  console.log("✅ Transfer was successful: ", transfer.toString());
})();

// ========================== UTILS FUNCTIONS ===================================
function webhookAlreadyExists(webhooks) {
  for (let currentWebhook of webhooks.data) {
    if (
      currentWebhook.getEventType() === "wallet_activity" &&
      currentWebhook.getNotificationURI() === webhookNotificationUri
    ) {
      return true;
    }
  }
  return false;
}

function transformConfig(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const originalConfig = JSON.parse(rawData);
    const walletId = Object.keys(originalConfig)[0];
    const { seed } = originalConfig[walletId];
    return {
      walletId,
      seed,
    };
  } catch (error) {
    console.error("Error reading or parsing file:", error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

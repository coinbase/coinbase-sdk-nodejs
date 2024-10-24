import "dotenv/config";
import { Coinbase, Webhook, Wallet } from "@coinbase/coinbase-sdk";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

(async function() {
  const webhookNotificationUri = process.env.WEBHOOK_NOTIFICATION_URL;
  if (!webhookNotificationUri) {
    console.log('WEBHOOK_NOTIFICATION_URL is missing from env file.');
    return;
  }
  
  //You should now, create a couple of wallets:
  let myWallet = await Wallet.create();
  let anotherWallet = await Wallet.create();
  
  // After you created the wallet, let's add some USDC funds to it:
  await myWallet.faucet(Coinbase.assets.Usdc);
  
  // Now use below code to get wallets addresses so we can use it for adding it to the webhook filter.
  let myWalletAddress = await myWallet.getDefaultAddress();
  let anotherWalletAddress = await anotherWallet.getDefaultAddress();
  const myWalletAddressId = myWalletAddress.getId();
  const anotherWalletAddressId = anotherWalletAddress.getId();
  
  await Webhook.create({
    networkId: Coinbase.networks.BaseSepolia,
    notificationUri: webhookNotificationUri,
    eventType: 'erc20_transfer',
    eventFilters: [{
      from_address: myWalletAddressId,
      to_address: anotherWalletAddressId,
    }],
  });
  
  // Sometimes funds take a few seconds to be available on the wallet, so lets wait 3 secs
  await sleep(3000)
  
  // For testing this above example, let's now create a transfer between both wallets we created:
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
  console.log('Transfer was successful: ', transfer.toString());
})()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
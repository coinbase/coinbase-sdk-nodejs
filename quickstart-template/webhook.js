import { Coinbase, Webhook } from "@coinbase/coinbase-sdk";

// Change this to the path of your API key file downloaded from CDP portal.
Coinbase.configureFromJson({ filePath: "~/Downloads/cdp_api_key.json" });

// Be sure to update the uri to your webhook url
let webhook = await Webhook.create(
    'base-mainnet',
    'https://webhook.notification.url/callback',
    'erc20_transfer',
    [{ 'contract_address': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' }]
);
console.log(`Webhook successfully created: `, webhook.toString());

// List out the webhooks created
let webhooks = await Webhook.list();

// Iterate over all webhooks created
// You cna also see list of webhook from CDP Portal
// https://portal.cdp.coinbase.com/products/webhooks
for (const wh in webhooks) {
    console.log(wh.toString());
}

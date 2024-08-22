### Quickstart template for Platform SDK

This is a template repository for quickly getting started with the Platform SDK. It provides a simple example of how to use the SDK.

## Create a Wallet, Fund, and Transfer

To set up the template, run the following commands:
```bash
npm install
npm run start
```

This command will create a developer-custodial wallet, deposit testnet funds to it and perform a transfer to another wallet.

## Trade Assets

To set up the template, run the following commands:
```bash
npm install
npm run start-trade-assets
```

This command will create a developer-custodial wallet on Base Mainnet and trade ETH for USDC.

## Mass Payout

To set up the template, run the following commands:
```bash
npm install
npm run start-mass-payout
```

This command will demonstrate how to automatically send batched payments from a CSV file with a non-MPC API Wallet.

## Webhook

If you don't already have a URL setup for event notification, 
you can follow these [instructions to setup a simple Webhook App](./webhook/README.md).

To set up the template, run the following commands:
```bash
npm install
npm run start-webhook
```

This command will demonstrate how to create a webhook for ERC20 transfer events on USDC.

You can also use [CDP Portal](https://portal.cdp.coinbase.com/products/webhooks) for Webhook configurations.

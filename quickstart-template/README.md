# Quickstart template for Platform SDK

This is a template repository for quickly getting started with the Platform SDK. It provides a simple example of how to use the SDK.

## Create a Wallet, Fund, and Transfer

To set up the template, run the following commands:

```bash
npm install
npm run start
```

This command will create a developer-custodial wallet, deposit testnet funds to it and perform a transfer to another wallet.

## Wallet transaction history

To set up the template, run the following commands:

```bash
npm install
npm run start-wallet-history
```

This command will create a developer-custodial wallet, deposit testnet funds to it and perform a few transfers to another wallet and back. Then list all the transactions on that wallet.

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

### Webhook - transfer between wallets

We also have a template for setting up two wallets and a webhook and receiving the transfer information between those two wallets on your webhook.

To set up the template, run the following commands:

```bash
npm install
npm run start-webhook-wallet-transfer
```

On this template, we'll demonstrate how to do a ERC20 transfer between two wallets and receive that transfer on your webhook.

_Note: Although usually transactions are sent to webhook within a minute, it may take several minutes for it to be sent to the webhook._

You can find more information about webhooks in the [documentation](https://docs.cdp.coinbase.com/onchain-data/docs/webhooks).

_____________________

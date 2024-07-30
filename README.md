# Coinbase Node.js SDK

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]


The Coinbase Node.js SDK enables the simple integration of crypto into your app. By calling Coinbase's Platform APIs, the SDK allows you to provision crypto wallets, send crypto into/out of those wallets, track wallet balances, and trade crypto from one asset into another.

The SDK currently supports Customer-custodied Wallets on the Base Sepolia test network.

**NOTE: The Coinbase SDK is currently in Alpha. The SDK:**

- **may make backwards-incompatible changes between releases**
- **should not be used on Mainnet (i.e. with real funds)**

Currently, the SDK is intended for use on testnet for quick bootstrapping of crypto wallets at hackathons, code academies, and other development settings.

## Documentation

- [Platform API Documentation](https://docs.cdp.coinbase.com/platform-apis/docs/welcome)

## Requirements

The Coinbase server-side SDK requires Node.js version 18 or higher and npm version 9.7.2 or higher. To view your currently installed versions of Node.js, run the following from the command-line:

```bash
node -v
npm -v
```

We recommend installing and managing Node.js and npm versions with `nvm`. See [Installing and Updating](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) in the `nvm` README for instructions on how to install `nvm`.

Once `nvm` has been installed, you can install and use the latest versions of Node.js and npm by running the following commands:

```bash
nvm install node # "node" is an alias for the latest version
nvm use node
```

## Installation

Optional: Initialize the npm

This command initializes a new npm project with default settings and configures it to use ES modules by setting the type field to "module" in the package.json file. 

```bash
npm init -y; npm pkg set type="module"
```

#### You can import the SDK as follows
```bash
npm install @coinbase/coinbase-sdk
```

or

```bash
yarn install @coinbase/coinbase-sdk
```

## Usage

### Initialization

#### You can import the SDK as follows:

CommonJs:

```javascript
const { Coinbase } = require("@coinbase/coinbase-sdk");
```

ES modules:

```typescript
import { Coinbase } from "@coinbase/coinbase-sdk";
```

To start, [create a CDP API Key](https://portal.cdp.coinbase.com/access/api). Then, initialize the Platform SDK by passing your API Key name and API Key's private key via the `Coinbase` constructor:

```typescript
const apiKeyName = "Copy your API Key name here.";

const privateKey = "Copy your API Key's private key here.";

const coinbase = new Coinbase({ apiKeyName: apiKeyName, privateKey: privateKey });
```

If you are using a CDP Server-Signer to manage your private keys, enable it with the constuctor option:
```typescript
const coinbase = new Coinbase({ apiKeyName: apiKeyName, privateKey: apiKeyPrivateKey, useServerSigner: true })
```

Another way to initialize the SDK is by sourcing the API key from the json file that contains your API key, downloaded from CDP portal.

```typescript
const coinbase = Coinbase.configureFromJson({ filePath: "path/to/your/api-key.json" });
```

This will allow you to authenticate with the Platform APIs and get access to the default `User`.

CommonJs:

```javascript
const { Coinbase } = require("@coinbase/coinbase-sdk");
const coinbase = Coinbase.configureFromJson("path/to/your/api-key.json");
coinbase.getDefaultUser().then(user => {
  console.log(user);
});
```

Or using ES modules and async/await:

```typescript
import { Coinbase } from "@coinbase/coinbase-sdk";
const coinbase = Coinbase.configureFromJson("path/to/your/api-key.json");
const user = await coinbase.getDefaultUser();
console.log(user);
```

### Wallets, Addresses, and Transfers

Now, create a Wallet from the User. Wallets are created with a single default Address.

```typescript
// Create a Wallet with one Address by default.
const wallet = await user.createWallet();
```

Next, view the default Address of your Wallet. You will need this default Address in order to fund the Wallet for your first Transfer.

```typescript
// A Wallet has a default Address.
const address = wallet.getDefaultAddress();
console.log(`Address: ${address}`);
```

Wallets do not have funds on them to start. In order to fund the Address, you will need to send funds to the Wallet you generated above. If you don't have testnet funds, get funds from a [faucet](https://docs.base.org/docs/tools/network-faucets/).

For development purposes, we provide a `faucet` method to fund your address with ETH on Base Sepolia testnet. We allow one faucet claim per address in a 24 hour window.

```typescript
// Create a faucet request that returns you a Faucet transaction that can be used to track the tx hash.
const faucetTransaction = await wallet.faucet();
console.log(`Faucet transaction: ${faucetTransaction}`);
```

```typescript
// Create a new Wallet to transfer funds to.
// Then, we can transfer 0.00001 ETH out of the Wallet to another Wallet.
const anotherWallet = await user.createWallet();
const transfer = await wallet.createTransfer({ amount: 0.00001, assetId: Coinbase.assets.Eth, destination: anotherWallet });
```


### Trading Funds

```typescript
// Create a Wallet on `base-mainnet` to trade assets with.
let mainnetWallet = await user.createWallet({ networkId: Coinbase.networks.BaseMainnet });

console.log(`Wallet successfully created: ${mainnetWallet}`);

// Fund your Wallet's default Address with ETH from an external source.

// Trade 0.00001 ETH to USDC
let trade = await wallet.createTrade({ amount: 0.00001, fromAssetId: Coinbase.assets.Eth, toAssetId: Coinbase.assets.Usdc });

console.log(`Second trade successfully completed: ${trade}`);
```

### Re-Instantiating Wallets

The SDK creates Wallets with developer managed keys, which means you are responsible for securely storing the keys required to re-instantiate Wallets. The below code walks you through how to export a Wallet and store it in a secure location.

```typescript
// Export the data required to re-instantiate the Wallet.
const data = wallet.export();
```

In order to persist the data for the Wallet, you will need to implement a store method to store the data export in a secure location. If you do not store the Wallet in a secure location you will lose access to the Wallet and all of the funds on it.

```typescript
// At this point, you should implement your own "store" method to securely persist
// the data required to re-instantiate the Wallet at a later time.
await store(data);
```

For convenience during testing, we provide a `saveSeed` method that stores the wallet's seed in your local file system. This is an insecure method of storing wallet seeds and should only be used for development purposes.

```typescript
wallet.saveSeed(wallet);
```

To encrypt the saved data, set encrypt to true. Note that your CDP API key also serves as the encryption key for the data persisted locally. To re-instantiate wallets with encrypted data, ensure that your SDK is configured with the same API key when invoking `saveSeed` and `loadSeed`.

```typescript
wallet.saveSeed(wallet, true);
```

The below code demonstrates how to re-instantiate a Wallet from the data export.

```typescript
// The Wallet can be re-instantiated using the exported data.
const importedWallet = await user.importWallet(data);
```

To import Wallets that were persisted to your local file system using `saveSeed`, use the below code.

```typescript
// Ensure your seed file path is updated
const seedFilePath = "";
const userWallet = await user.getWallet(wallet.getId());
await userWallet.loadSeed(seedFilePath);
```



[npm]: https://img.shields.io/npm/v/@coinbase/coinbase-sdk
[npm-url]: https://www.npmjs.com/package/@coinbase/coinbase-sdk
[build-size]: https://badgen.net/bundlephobia/minzip/@coinbase/coinbase-sdk
[build-size-url]: https://bundlephobia.com/result?p=@coinbase/coinbase-sdk
[npmtrends-url]: https://www.npmtrends.com/@coinbase/coinbase-sdk
[npm-downloads]: https://img.shields.io/npm/dw/@coinbase/coinbase-sdk

# Coinbase Node.js SDK

The Coinbase Node.js SDK enables the simple integration of crypto into your app.
By calling Coinbase's Platform APIs, the SDK allows you to provision crypto wallets,
send crypto into/out of those wallets, track wallet balances, and trade crypto from
one asset into another.

The SDK currently supports Customer-custodied Wallets on the Base Sepolia test network.

**NOTE: The Coinbase SDK is currently in Alpha. The SDK:**

- **may make backwards-incompatible changes between releases**
- **should not be used on Mainnet (i.e. with real funds)**

Currently, the SDK is intended for use on testnet for quick bootstrapping of crypto wallets at
hackathons, code academies, and other development settings.

## Documentation

- [Platform API Documentation](https://docs.cdp.coinbase.com/platform-apis/docs/welcome)

## Installation

### In Your Node.js Project

```bash
npm install @coinbase/coinbase-sdk
```

or

```bash
yarn install @coinbase/coinbase-sdk
```

### In the ts-node REPL

After running `npx ts-node` to start the REPL, you can import the SDK as follows:

```typescript
import { Coinbase } from '@coinbase/coinbase-sdk';
```
### Requirements

- Node.js 18 or higher

## Usage

### Initialization

To start, [create a CDP API Key](https://portal.cdp.coinbase.com/access/api). Then, initialize the Platform SDK by passing your API Key name and API Key's private key via the `Coinbase` constructor:

```typescript
const apiKeyName = 'Copy your API Key name here.';

const apiKeyPrivateKey = 'Copy your API Key\'s private key here.';

const coinbase = new Coinbase(apiKeyName, apiKeyPrivateKey);
```

Another way to initialize the SDK is by sourcing the API key from the json file that contains your API key, 
downloaded from CDP portal. 

```typescript
const coinbase = Coinbase.configureFromJson('path/to/your/api-key.json');
```

This will allow you to authenticate with the Platform APIs and get access to the default `User`.

```typescript
const user = await coinbase.getDefaultUser();
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
const address = await wallet.getDefaultAddress();
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
const transfer = await wallet.createTransfer(0.00001, Coinbase.assetList.Eth, anotherWallet);
```

## Development

### Node.js Version

Developing in this repository requires Node.js 18 or higher.

### Set-up

Clone the repo by running:

```bash
git clone git@github.com:coinbase/coinbase-sdk-nodejs.git
```

To install all dependencies, run:

```bash
npm install
```

### Linting

To autocorrect all lint errors, run:

```bash
npm run lint-fix
```

To detect all lint errors, run:

```bash
npm run lint
```

### Testing

To run all tests, run:

```bash
npm test
```

To run a specific test, run (for example):

```bash
npx jest ./src/coinbase/tests/wallet_test.ts
```

### REPL

The repository is equipped with a REPL to allow developers to play with the SDK. To start
it, run:

```bash
npx ts-node
```

### Generating Documentation

To generate documentation from the TypeDoc comments, run:

```bash
npm run docs
```

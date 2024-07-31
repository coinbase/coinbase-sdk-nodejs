# Capabilities

The Coinbase SDK has different capabilities for different wallet types and networks. This page summarizes
those capabilities for the Ruby SDK:

## Developer Wallets

| Concept       | Base-Sepolia | Base-Mainnet | Ethereum-Holesky | Ethereum-Mainnet |
| ------------- | :----------: | :----------: | :--------------: | :--------------: |
| Addresses     |      ✅      |      ✅      |        ❌        |        ❌        |
| Send          |      ✅      |      ✅      |        ❌        |        ❌        |
| Trade         |      ❌      |      ✅      |        ❌        |        ❌        |
| Faucet        |      ✅      |      ❌      |        ✅        |        ❌        |
| Server-Signer |      ✅      |      ✅      |        ❌        |        ❌        |

## End-User Wallets

| Concept            | Base-Sepolia | Base-Mainnet | Ethereum-Holesky | Ethereum-Mainnet |
| ------------------ | :----------: | :----------: | :--------------: | :--------------: |
| External Addresses |      ✅      |      ✅      |        ✅        |        ✅        |
| Stake [^1]         |      ❌      |      ❌      |        ✅        |        ✅        |

[^1]: Dedicated ETH Staking is currently only available on Testnet (Ethereum-Holesky).

## Testnet vs. Mainnet

The Coinbase SDK supports both testnets and mainnets.

- Testnets are for building and testing applications. Funds are not real, and you can get test currencies from a faucet.
- Mainnet is where the funds, contracts and applications are real.

Wallets, assets, etc, cannot be moved from testnet to mainnet (or vice versa).

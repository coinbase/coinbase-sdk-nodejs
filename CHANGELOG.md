# Coinbase Node.js SDK Changelog

## [0.0.9] - 2024-06-24

### Added

- `CreateTransferOptions` type
- Support external addresses for balance fetching and requesting faucet funds.
- Support for building staking operations and transactions
- Support for retrieving staking rewards information

## [0.0.8] - 2024-06-18

### Added

- Support assets dynamically from the backend without SDK changes.

## [0.0.7] - 2024-06-11

### Added

- Added Base Mainnet network support
- `ServerSigner` object
- Ability to get default Server-Signer

### Changed

Updated the usage of `Coinbase.networkList` to `Coinbase.networks`

## [0.0.6] - 2024-06-03

### Added

- Ability to create wallets backed by server signers and transfer with them
- Changed save_wallet to save_seed
- Changed load_wallets to load_seed and moved at wallet level

### Changed

- Changed save_wallet to save_seed
- Changed load_wallets to load_seed and moved at wallet level

## [0.0.4] - 2024-05-28

### Added

Initial release of the Coinbase NodeJS.

- Supported networks: Base Sepolia
- Wallet create and import
- Address management
- Send and receive ETH, ETC-20s
- Ability to hydrate wallets
- API Key-based authentication
- API HTTP debugging
- User object and getDefaultUser
- Individual private key export
- Error specifications

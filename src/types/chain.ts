import { NetworkIdentifier } from "../client/api";

/**
 * Maps chain IDs to their corresponding Coinbase network IDs
 */
export const CHAIN_ID_TO_NETWORK_ID = {
  1: "ethereum-mainnet",
  11155111: "ethereum-sepolia",
  137: "polygon-mainnet",
  80001: "polygon-mumbai",
  8453: "base-mainnet",
  84532: "base-sepolia",
  42161: "arbitrum-mainnet",
  421614: "arbitrum-sepolia",
  10: "optimism-mainnet",
  11155420: "optimism-sepolia",
} as const;

/**
 * Supported chain IDs are the keys of the CHAIN_ID_TO_NETWORK_ID object
 */
export type SupportedChainId = keyof typeof CHAIN_ID_TO_NETWORK_ID;

/**
 * Represents a chainID and the corresponding Coinbase network ID
 */
export type Network = {
  chainId: SupportedChainId;
  networkId: NetworkIdentifier;
};

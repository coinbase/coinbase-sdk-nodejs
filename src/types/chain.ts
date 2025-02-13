import { NetworkIdentifier } from "../client/api";

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

export type SupportedChainId = keyof typeof CHAIN_ID_TO_NETWORK_ID;

export type Network = {
  chainId: SupportedChainId;
  networkId: NetworkIdentifier;
};

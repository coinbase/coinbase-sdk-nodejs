import { NetworkIdentifier } from "../client/api";

/**
 * Maps chain IDs to their corresponding Coinbase network IDs. Only SmartWallet related chains are listed here right now.
 */
export const CHAIN_ID_TO_NETWORK_ID = {
  8453: NetworkIdentifier.BaseMainnet,
  84532: NetworkIdentifier.BaseSepolia,
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

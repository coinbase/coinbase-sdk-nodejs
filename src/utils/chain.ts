import { CHAIN_ID_TO_NETWORK_ID, SupportedChainId, Network } from "../types/chain";

/**
 * Creates a network configuration for a given chain ID
 * @param chainId - The chain ID to create a network configuration for
 * @returns The network configuration
 */
export function createNetwork(chainId: SupportedChainId): Network {
  return {
    chainId,
    networkId: CHAIN_ID_TO_NETWORK_ID[chainId],
  };
}

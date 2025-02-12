import { NetworkIdentifier } from "../client/api";
import { CHAIN_ID_TO_NETWORK_ID, SupportedChainId, Network } from "../types/chain";

export function createNetwork(chainId: SupportedChainId): Network {
  return {
    chainId,
    networkId: CHAIN_ID_TO_NETWORK_ID[chainId] as NetworkIdentifier,
  };
}

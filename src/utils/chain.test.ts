import { createNetwork } from "./chain";
import { CHAIN_ID_TO_NETWORK_ID, SupportedChainId } from "../types/chain";

describe("createNetwork", () => {
  it("should handle all supported chain IDs", () => {
    const supportedChainIds = Object.keys(CHAIN_ID_TO_NETWORK_ID).map(Number) as SupportedChainId[];

    supportedChainIds.forEach(chainId => {
      const result = createNetwork(chainId);
      expect(result).toEqual({
        chainId: chainId,
        networkId: CHAIN_ID_TO_NETWORK_ID[chainId],
      });
    });
  });
  it("should return undefined networkId for an unsupported chain ID", () => {
    const result = createNetwork(1 as SupportedChainId);
    expect(result).toEqual({
      chainId: 1,
      networkId: undefined,
    });
  });
});

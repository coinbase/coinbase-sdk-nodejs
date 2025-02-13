import {
  NetworkScopedSmartWallet,
  Signer,
  SmartWalletNetworkOptions,
  type SmartWallet,
} from "./types";
import { sendUserOperation } from "../actions/sendUserOperation";
import type { Address, LocalAccount } from "viem";
import { createNetwork } from "../utils/chain";

/**
 * Options for converting a smart wallet address and signer to a SmartWallet instance
 */
export type ToSmartWalletOptions = {
  /** The address of the smart wallet */
  smartWalletAddress: Address;
  /** The signer that will own the smart wallet */
  signer: Signer;
};

/**
 * Converts a smart wallet address and signer to a SmartWallet instance
 *
 * @example
 * ```ts
 * import { toSmartWallet } from "@coinbase/coinbase-sdk";
 *
 * const wallet = toSmartWallet({
 *   smartWalletAddress: "0x1234567890123456789012345678901234567890",
 *   signer: localAccount
 * });
 * ```
 *
 * @param {ToSmartWalletOptions} options - Options for converting the smart wallet address and signer to a SmartWallet instance
 * @returns {SmartWallet} The SmartWallet instance
 */
export function toSmartWallet(options: ToSmartWalletOptions): SmartWallet {
  const wallet: SmartWallet = {
    address: options.smartWalletAddress,
    owners: [options.signer],
    type: "smart",
    sendUserOperation: options => sendUserOperation(wallet, options),
    useNetwork: (options: SmartWalletNetworkOptions) => {
      const network = createNetwork(options.chainId);
      return {
        ...wallet,
        network,
        paymasterUrl: options.paymasterUrl,
        sendUserOperation: options =>
          sendUserOperation(wallet, {
            ...options,
            chainId: network.chainId,
          }),
      } as NetworkScopedSmartWallet;
    },
  };

  return wallet;
}

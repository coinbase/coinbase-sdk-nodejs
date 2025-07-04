import {
  NetworkScopedSmartWallet,
  Signer,
  SmartWalletNetworkOptions,
  type SmartWallet,
} from "./types";
import { sendUserOperation } from "../actions/sendUserOperation";
import type { Address } from "../types/misc";
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
 * Creates a SmartWallet instance from an existing smart wallet address and signer.
 * Use this to interact with previously deployed smart wallets, rather than creating new ones.
 *
 * The signer must be the original owner of the smart wallet.
 *
 * @example
 * ```typescript
 * import { toSmartWallet } from "@coinbase/coinbase-sdk";
 *
 * // Connect to an existing smart wallet
 * const wallet = toSmartWallet({
 *   smartWalletAddress: "0x1234567890123456789012345678901234567890",
 *   signer: localAccount
 * });
 *
 * // Use on a specific network
 * const networkWallet = wallet.useNetwork({
 *   chainId: 8453, // Base Mainnet
 *   paymasterUrl: "https://paymaster.example.com"
 * });
 * ```
 *
 * @param {ToSmartWalletOptions} options - Configuration options
 * @param {string} options.smartWalletAddress - The deployed smart wallet's address
 * @param {Signer} options.signer - The owner's signer instance
 * @returns {SmartWallet} A configured SmartWallet instance ready for transaction submission
 * @throws {Error} If the signer is not an original owner of the wallet
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

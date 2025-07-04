import type { Hash, Hex, Address } from "../types/misc";
import type {
  SendUserOperationOptions,
  SendUserOperationReturnType,
} from "../actions/sendUserOperation";
import type { Network, SupportedChainId } from "../types/chain";
import type { Prettify } from "../types/utils";

/**
 * Options for configuring a SmartWallet for a specific network
 */
export type SmartWalletNetworkOptions = {
  /** The chain ID of the network to connect to */
  chainId: SupportedChainId;
  /** Optional URL for the paymaster service */
  paymasterUrl?: string;
};

/**
 * Represents a signer that can sign messages
 */
export type Signer = {
  /** The address of the signer */
  address: Address;
  /** Signs a message hash and returns the signature as a hex string */
  sign: (parameters: { hash: Hash }) => Promise<Hex>;
};

/**
 * Represents a SmartWallet with user operation capabilities
 */
export type SmartWallet = {
  /** The smart wallet's address */
  address: Address;
  /** Array of signers that own the wallet (currently only supports one owner) */
  owners: Signer[];
  /** Identifier for the wallet type */
  type: "smart";
  /**
   * Sends a user operation to the network
   *
   * @param {SmartWallet} wallet - The smart wallet to send the user operation from
   * @param - {@link SendUserOperationOptions<T>} options - The options for the user operation
   * @returns {Promise<SendUserOperationReturnType>} The result of the user operation
   *
   * @example
   * ```ts
   * import { sendUserOperation } from "@coinbase/coinbase-sdk";
   * import { parseEther } from "viem";
   *
   * const result = await sendUserOperation(wallet, {
   *   calls: [
   *     {
   *       to: "0x1234567890123456789012345678901234567890",
   *       abi: erc20Abi,
   *       functionName: "transfer",
   *       args: [to, amount],
   *     },
   *     {
   *       to: "0x1234567890123456789012345678901234567890",
   *       data: "0x",
   *       value: parseEther("0.0000005"),
   *     },
   *   ],
   *   chainId: 1,
   *   paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/someapikey",
   * });
   * ```
   *
   */
  sendUserOperation: <T extends readonly unknown[]>(
    options: SendUserOperationOptions<T>,
  ) => Promise<SendUserOperationReturnType>;
  /** Configures the wallet for a specific network */
  useNetwork: (options: SmartWalletNetworkOptions) => NetworkScopedSmartWallet;
};

/**
 * A smart wallet that's configured for a specific network
 */
export type NetworkScopedSmartWallet = Prettify<
  Omit<SmartWallet, "sendUserOperation"> & {
    /** The network configuration */
    network: Network;
    /** Optional URL for the paymaster service */
    paymasterUrl?: string;
    /** Sends a user operation to the configured network */
    sendUserOperation: <T extends readonly unknown[]>(
      options: Prettify<Omit<SendUserOperationOptions<T>, "chainId" | "paymasterUrl">>,
    ) => Promise<SendUserOperationReturnType>;
  }
>;

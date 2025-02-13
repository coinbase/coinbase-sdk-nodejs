import type { Address } from "abitype";
import type { Hash, Hex } from "viem";
import type {
  SendUserOperationOptions,
  SendUserOperationReturnType,
} from "../actions/sendUserOperation";
import type { Network, SupportedChainId } from "../types/chain";
import type { Prettify } from "viem";

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
  /** Sends a user operation to the network */
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

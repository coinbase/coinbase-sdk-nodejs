import { ethers } from "ethers";
import { TypedDataDomain, TypedDataField } from "./types";

/**
 * Computes the EIP-191 personal-sign message digest to sign.
 *
 * @returns The EIP-191 hash of the message as a string.
 * @throws {Error} if the message cannot be hashed.
 * @param message - The message to hash.
 */
export const hashMessage = (message: Uint8Array | string): string => {
  return ethers.hashMessage(message);
};

/**
 * Computes the hash of the EIP-712 compliant typed data message.
 *
 * @param domain - The domain parameters for the EIP-712 message, including the name, version, chainId, and verifying contract.
 * @param types - The types definitions for the EIP-712 message, represented as a record of type names to their fields.
 * @param value - The actual data object to hash, conforming to the types defined.
 *
 * @returns The EIP-712 hash of the typed data as a hex-encoded string.
 * @throws {Error} if the typed data cannot be hashed.
 */
export const hashTypedDataMessage = (
  domain: TypedDataDomain,
  types: Record<string, Array<TypedDataField>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>,
): string => {
  return ethers.TypedDataEncoder.hash(domain, types, value);
};

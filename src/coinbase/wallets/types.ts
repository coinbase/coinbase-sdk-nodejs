import type { Address } from "abitype";
import type { LocalAccount } from "viem";
import type { NetworkIdentifier } from "../../client";
import {
  SendUserOperationOptions,
  SendUserOperationReturnType,
} from "../actions/sendUserOperation";

export type SmartWallet = {
  address: Address;
  account: LocalAccount;
  networkId?: NetworkIdentifier;
  type: "smart";
  sendUserOperation: <T extends readonly unknown[]>(
    options: SendUserOperationOptions<T>,
  ) => Promise<SendUserOperationReturnType>;
  useNetwork: (options: { networkId: NetworkIdentifier }) => void;
};

// In the future, we may introduce BaseWallet (or named differently to avoid Base chain confusion). BaseWallet would be a base class for all wallets.
// We would have a PrivateKeyWallet type that extends BaseWallet and adds signTransaction which is specific to private key wallets.
// We would have a HDKeyWallet type that extends the PrivateKeyWallet type and adds a method to get the HD key used by the private key wallet.
// We would update the SmartWallet type to extend BaseWallet to add support for common wallet signing methods.
// export type BaseWallet = {
//   sign: (parameters: { hash: Hash }) => Promise<Hex>
//   signMessage: ({ message }: { message: SignableMessage }) => Promise<Hex>
//   signTypedData: (
//     typedData: TypedData | { [key: string]: unknown },
//   ) => Promise<Hex>
// }

// export type PrivateKeyWallet = Prettify<BaseWallet & {
//   address: Address
//   publicKey: Hex
//   type: 'privateKey'
//   signTransaction: (transaction: TransactionRequest) => Promise<Hex>;
// }>

// export type HDKeyWallet = Prettify<PrivateKeyWallet & {
//   hdKey: HDKey
//   type: 'hd'
// }>

// export type SmartWallet = Prettify<BaseWallet & {
//   address: Address
//   account: LocalAccount
//   networkId?: NetworkIdentifier
//   type: 'smart'
//   sendUserOperation: <T extends readonly unknown[]>(options: SendUserOperationOptions<T>) => Promise<SendUserOperationReturnType>
// }>

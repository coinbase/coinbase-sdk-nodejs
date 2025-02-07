import { hashTypedData, keccak256, serializeTransaction } from "viem";
import { toAccount } from "viem/accounts";
import type {
  HashTypedDataParameters,
  Hex, LocalAccount,
  SerializeTransactionFn,
  SignableMessage,
  TransactionSerializable,
  TypedData
} from "viem";
import { WalletAddress } from "../address/wallet_address";
import { hashMessage } from "viem";

export function toLocalAccount(address: WalletAddress): LocalAccount {
  return toAccount({
    address: address.getId() as `0x${string}`,
    signMessage: function ({
      message,
    }: {
      message: SignableMessage;
    }): Promise<Hex> {
      return signMessage(address, message);
    },
    signTransaction: function <
      TTransactionSerializable extends TransactionSerializable,
    >(
      transaction: TTransactionSerializable,
      args?:
        | { serializer?: SerializeTransactionFn<TTransactionSerializable> }
        | undefined,
    ): Promise<Hex> {
      const serializer = !args?.serializer
        ? serializeTransaction
        : args.serializer;

      return signTransaction(
        address,
        transaction,
        serializer,
      );
    },
    signTypedData: function (
      typedData: TypedData | { [key: string]: unknown },
    ): Promise<Hex> {
      return signTypedData(address, typedData);
    },
  });


}

export async function signMessage(
  address: WalletAddress,
  message: SignableMessage
): Promise<Hex> {
  const hashedMessage = hashMessage(message);
  const payloadSignature = await address.createPayloadSignature(
    hashedMessage
  );
  return `${payloadSignature.getSignature()}` as Hex;
}

export async function signTransaction<
  TTransactionSerializable extends TransactionSerializable,
>(
  address: WalletAddress,
  transaction: TTransactionSerializable,
  serializer: SerializeTransactionFn<TTransactionSerializable>,
): Promise<Hex> {
  const serializedTx = serializer(transaction);
  const transactionHash = keccak256(serializedTx);
  const payload = await address.createPayloadSignature(transactionHash);
  return `${payload}` as Hex;
}

export async function signTypedData(
  address: WalletAddress,
  data: TypedData | { [key: string]: unknown },
): Promise<Hex> {
  const hashToSign = hashTypedData(data as HashTypedDataParameters);
  const payloadSignature = await address.createPayloadSignature(hashToSign);
  return `${payloadSignature.getSignature()}` as Hex;
}

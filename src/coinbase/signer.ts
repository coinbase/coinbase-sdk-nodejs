import type { 
    LocalAccount,
    Address,
    Hash,
    Transaction,
    TypedData
  } from 'viem'

interface WalletSigner {
  // Core viem account properties
  address: Address;
  type: 'local';
  source: 'custom';
  
  // Standard signing methods from viem
  sign(hash: Hash): Promise<Hash>;
  signMessage(message: string | Bytes): Promise<Hash>;
  signTransaction(transaction: Transaction): Promise<Hash>;
  signTypedData(typedData: TypedData): Promise<Hash>;
  
  // Optional: Add any smart wallet specific methods
  signUserOperation?(userOp: UserOperation): Promise<Hash>;
}
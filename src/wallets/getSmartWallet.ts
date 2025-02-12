import { NetworkScopedSmartWallet, SmartWalletNetworkOptions, type SmartWallet } from "./types";
import { Coinbase } from "../index"
import { sendUserOperation } from "../actions/sendUserOperation";
import type { Address, LocalAccount } from "viem";
import { SupportedChainId } from "../types/chain";
import { createNetwork } from "../utils/chain";

export type GetSmartWalletOptions = {
  smartWalletAddress: Address;
  account: LocalAccount;
};

export async function getSmartWallet(options: GetSmartWalletOptions): Promise<SmartWallet> {
  const result = await Coinbase.apiClients.smartWallet!.getSmartWallet(options.smartWalletAddress);
  
  // if (!result.data) {
  //   throw new Error("Failed to get smart wallet");
  // }

  if (result.data.owners.some(owner => owner.toLowerCase() === options.account.address.toLowerCase())) {
    throw new Error('Account is not an owner of the smart wallet');
  }



  const wallet: SmartWallet = {
    address: result.data.address as `0x${string}`,
    account: options.account,
    type: "smart",
    sendUserOperation: options => sendUserOperation(wallet, options),
    useNetwork: (options: SmartWalletNetworkOptions) => {
      const network = createNetwork(options.chainId);
      return {
        ...wallet,
        network,
        paymasterUrl: options.paymasterUrl,
        sendUserOperation: options => sendUserOperation(wallet, {
          ...options,
          chainId: network.chainId,
        }),
      } as NetworkScopedSmartWallet;
    },
  };

  return wallet;
}

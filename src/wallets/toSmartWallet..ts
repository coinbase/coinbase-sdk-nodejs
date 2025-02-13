import { NetworkScopedSmartWallet, SmartWalletNetworkOptions, type SmartWallet } from "./types";
import { Coinbase } from "../index";
import { sendUserOperation } from "../actions/sendUserOperation";
import type { Address, LocalAccount } from "viem";
import { createNetwork } from "../utils/chain";

export type ToSmartWalletOptions = {
  smartWalletAddress: Address;
  account: LocalAccount;
};

export async function toSmartWallet(options: ToSmartWalletOptions): Promise<SmartWallet> {
  const wallet: SmartWallet = {
    address: options.smartWalletAddress,
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

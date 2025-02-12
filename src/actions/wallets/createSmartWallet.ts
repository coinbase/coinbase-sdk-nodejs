import { type SmartWallet } from "./types";
import { Coinbase } from "../coinbase";
import { sendUserOperation } from "../actions/sendUserOperation";
import type { LocalAccount } from "viem";
import { createNetwork, SupportedChainId } from "../types";

export type CreateSmartWalletOptions = {
  account: LocalAccount;
};

export async function createSmartWallet(options: CreateSmartWalletOptions): Promise<SmartWallet> {
  const result = await Coinbase.apiClients.smartWallet!.createSmartWallet({
    owner: options.account.address,
  });

  if (!result.data) {
    throw new Error("Failed to create smart wallet");
  }

  const wallet: SmartWallet = {
    address: result.data.address as `0x${string}`,
    account: options.account,
    type: "smart",
    sendUserOperation: options => sendUserOperation(wallet, options),
    switchChain: (options: { chainId: SupportedChainId }) => {
      wallet.network = createNetwork(options.chainId);
    },
  };

  return wallet;
}

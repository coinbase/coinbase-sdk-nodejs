import { SmartWalletNetworkOptions, type SmartWallet } from "./types";
import { Coinbase } from "../index";
import { sendUserOperation } from "../actions/sendUserOperation";
import type { Address, LocalAccount } from "viem";
import { createNetwork } from "../utils/chain";
import { toSmartWallet } from "./toSmartWallet.";

export type CreateSmartWalletOptions = {
  account: LocalAccount;
};

export async function createSmartWallet(options: CreateSmartWalletOptions): Promise<SmartWallet> {
  const result = await Coinbase.apiClients.smartWallet!.createSmartWallet({
    owner: options.account.address,
  });

  return toSmartWallet({
    smartWalletAddress: result.data.address as Address,
    account: options.account,
  });
}

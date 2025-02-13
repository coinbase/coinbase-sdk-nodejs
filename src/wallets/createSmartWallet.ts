import { Signer, type SmartWallet } from "./types";
import { Coinbase } from "../index";
import type { Address } from "viem";
import { toSmartWallet } from "./toSmartWallet.";

export type CreateSmartWalletOptions = {
  signer: Signer;
};

export async function createSmartWallet(options: CreateSmartWalletOptions): Promise<SmartWallet> {
  const result = await Coinbase.apiClients.smartWallet!.createSmartWallet({
    owner: options.signer.address,
  });

  return toSmartWallet({
    smartWalletAddress: result.data.address as Address,
    signer: options.signer,
  });
}

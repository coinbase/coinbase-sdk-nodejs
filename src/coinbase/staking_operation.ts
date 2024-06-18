import { ethers } from "ethers";
import { StakingOperation as StakingOperationModel } from "../client/api";
import { Transaction } from "./transaction";

/**
 * A representation of a staking operation (stake, unstake, claim rewards, etc). It
 * may have multiple steps with some being transactions to sign, and others to wait.
 */
export class StakingOperation {
  private model: StakingOperationModel;
  private transactions: Transaction[];

  /**
   * Creates a StakingOperation object.
   *
   * @class
   * @param model - The staking operation response from the API call.
   */
  constructor(model: StakingOperationModel) {
    if (!model) {
      throw new Error("Invalid model type");
    }
    this.model = model;
    this.transactions = [new Transaction(model.transaction)];
  }

  /**
   * Sign the transactions in the StakingOperation object.
   *
   * @param key - The key used to sign the transactions.
   */
  public async sign(key: ethers.Wallet): Promise<void> {
    this.transactions.forEach(tx => {
      if (!tx.isSigned()) {
        tx.sign(key);
      }
    });
  }
}

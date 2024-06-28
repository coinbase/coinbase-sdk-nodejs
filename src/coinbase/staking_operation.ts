import { ethers } from "ethers";
import {
  StakingOperation as StakingOperationModel,
  StakingOperationStatusEnum,
} from "../client/api";
import { Transaction } from "./transaction";
import { Coinbase } from "./coinbase";

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
    this.transactions = [];
    if (model.transactions) {
      model.transactions.forEach(transaction => {
        this.transactions.push(new Transaction(transaction));
      });
    }
  }

  /**
   * Get the transactions associated with this staking operation.
   *
   * @returns The array of transactions.
   */
  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  /**
   * Get the status of the staking operation.
   *
   * @returns The status of the staking operation.
   */
  public getStatus(): StakingOperationStatusEnum {
    return this.model.status;
  }

  /**
   * Get the staking operation for the given ID.
   *
   * @returns The staking operation object.
   */
  public async get(): Promise<StakingOperationModel> {
    const response = await Coinbase.apiClients.stake!.getStakingOperation(this.model.id);

    this.model = response.data;

    if (this.model.transactions) {
      this.model.transactions.forEach(transaction => {
        this.transactions.push(new Transaction(transaction));
      });
    }

    return this.model;
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

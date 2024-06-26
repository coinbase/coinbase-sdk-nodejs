import { StakingOperation } from "../coinbase/staking_operation";
import { VALID_STAKING_OPERATION_MODEL } from "./utils";
import { ethers } from "ethers";

describe("StakingOperation", () => {
  it("should initialize a new StakingOperation", () => {
    const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
    expect(op).toBeInstanceOf(StakingOperation);
  });
  it("should raise an error when initialized with a model of a different type", () => {
    expect(() => {
      new StakingOperation(null!);
    }).toThrow(Error);
  });

  describe(".getTransactions", () => {
    it("return the the array of transactions", () => {
      const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
      expect(op.getTransactions().length).toEqual(1);
    });
  });

  describe(".sign", () => {
    let key;
    it("should sign the transactions successfully", async () => {
      key = ethers.Wallet.createRandom();
      const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
      expect(async () => {
        await op.sign(key);
      }).not.toThrow(Error);
    });
  });
});

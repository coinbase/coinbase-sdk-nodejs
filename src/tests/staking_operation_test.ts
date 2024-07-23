import { StakingOperation } from "../coinbase/staking_operation";
import {
  mockReturnValue,
  mockStakingOperation,
  stakeApiMock,
  VALID_NATIVE_ETH_UNSTAKE_OPERATION_MODEL,
  VALID_STAKING_OPERATION_MODEL,
} from "./utils";
import { ethers } from "ethers";
import { StakingOperationStatusEnum } from "../client";
import { Coinbase } from "../coinbase/coinbase";

describe("StakingOperation", () => {
  beforeAll(() => {
    // Mock the stake functions.
    Coinbase.apiClients.stake = stakeApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      expect(op.getStatus()).toEqual(StakingOperationStatusEnum.Pending);
    });
  });

  describe(".getSignedVoluntaryExitMessages", () => {
    it("return the the array of signed exit messages", () => {
      const op = new StakingOperation(VALID_NATIVE_ETH_UNSTAKE_OPERATION_MODEL);
      const msgs = op.getSignedVoluntaryExitMessages();
      expect(msgs.length).toEqual(1);
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

  describe(".fetch", () => {
    it("should fetch the staking operation successfully", async () => {
      Coinbase.apiClients.stake!.getExternalStakingOperation = mockReturnValue(
        VALID_STAKING_OPERATION_MODEL,
      );

      const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
      const updatedStakeOp = await op.fetch();

      expect(Coinbase.apiClients.stake!.getExternalStakingOperation).toHaveBeenCalledWith(
        Coinbase.networks.EthereumHolesky,
        "some-address-id",
        "some-id",
      );

      expect(updatedStakeOp.transactions?.length).toEqual(1);
    });
  });

  describe(".wait", () => {
    it("should return the non-terminal StakeOperation state when the stake operation is not complete", async () => {
      const stakingOperation = new StakingOperation(VALID_STAKING_OPERATION_MODEL);

      Coinbase.apiClients.stake!.getExternalStakingOperation = mockReturnValue(
        mockStakingOperation(StakingOperationStatusEnum.Complete),
      );

      await stakingOperation.wait();
      expect(stakingOperation.getStatus()).toBe(StakingOperationStatusEnum.Complete);
    });

    it("should raise a timeout error", async () => {
      const stakingOperation = new StakingOperation(VALID_STAKING_OPERATION_MODEL);

      Coinbase.apiClients.stake!.getExternalStakingOperation = mockReturnValue(stakingOperation);

      await expect(
        stakingOperation.wait({
          intervalSeconds: 0.2,
          timeoutSeconds: 0.00001,
        }),
      ).rejects.toThrow("Staking operation timed out");
    });

    it("should raise a timeout when the request takes longer than the timeout", async () => {
      const stakingOperation = new StakingOperation(VALID_STAKING_OPERATION_MODEL);

      Coinbase.apiClients.stake!.getExternalStakingOperation = mockReturnValue(
        new Promise(resolve => {
          setTimeout(() => {
            resolve(stakingOperation);
          }, 400);
        }),
      );

      await expect(
        stakingOperation.wait({
          intervalSeconds: 0.2,
          timeoutSeconds: 0.00001,
        }),
      ).rejects.toThrow("Staking operation timed out");
    });

    it("all getters should work", async () => {
      const stakingOperation = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
      expect(stakingOperation.getID()).toBe("some-id");
      expect(stakingOperation.getStatus()).toBe(StakingOperationStatusEnum.Pending);
      expect(stakingOperation.isTerminalState()).toBe(false);
      expect(stakingOperation.getTransactions().length).toBe(1);
      expect(stakingOperation.getSignedVoluntaryExitMessages().length).toBe(0);
    });
  });
});

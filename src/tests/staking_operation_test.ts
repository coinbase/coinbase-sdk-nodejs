import { StakingOperation } from "../coinbase/staking_operation";
import {
  mockReturnValue,
  mockStakingOperation,
  stakeApiMock,
  walletStakeApiMock,
  VALID_NATIVE_ETH_UNSTAKE_OPERATION_MODEL,
  VALID_STAKING_OPERATION_MODEL,
} from "./utils";
import { ethers } from "ethers";
import { StakingOperationStatusEnum, TransactionStatusEnum } from "../client";
import { Coinbase } from "../coinbase/coinbase";

describe("StakingOperation", () => {
  beforeAll(() => {
    // Mock the stake functions.
    Coinbase.apiClients.stake = stakeApiMock;
    Coinbase.apiClients.walletStake = walletStakeApiMock;
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

  it("should return a string representation with id, status, network_id, and address_id", () => {
    const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
    const expectedString = `StakingOperation { id: some-id status: initialized network_id: ethereum-hoodi address_id: some-address-id }`;
    expect(op.toString()).toEqual(expectedString);
  });

  describe(".getTransactions", () => {
    it("return the the array of transactions", () => {
      const op = new StakingOperation(VALID_STAKING_OPERATION_MODEL);
      expect(op.getTransactions().length).toEqual(1);
      expect(op.getTransactions()[0].toAddressId()).toEqual("dummy-to-address-id");
      expect(op.getTransactions()[0].fromAddressId()).toEqual("dummy-from-address-id");
      expect(op.getTransactions()[0].getTransactionHash()).toEqual("0xdummy-transaction-hash");
      expect(op.getStatus()).toEqual(StakingOperationStatusEnum.Initialized);
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

  describe("StakingOperation.fetch", () => {
    const networkId = "dummy-network-id";
    const addressId = "dummy-address-id";
    const stakingOperationId = "dummy-staking-operation-id";
    const walletId = "dummy-wallet-id";

    const mockStakingOperationModel = {
      id: stakingOperationId,
      status: StakingOperationStatusEnum.Initialized,
      network_id: networkId,
      address_id: addressId,
      transactions: [],
    };

    it("should fetch staking operation without walletId", async () => {
      Coinbase.apiClients.stake!.getExternalStakingOperation = jest.fn().mockResolvedValue({
        data: mockStakingOperationModel,
      });

      const stakingOperation = await StakingOperation.fetch(
        networkId,
        addressId,
        stakingOperationId,
      );

      expect(Coinbase.apiClients.stake!.getExternalStakingOperation).toHaveBeenCalledWith(
        networkId,
        addressId,
        stakingOperationId,
      );

      expect(stakingOperation.getID()).toBe(stakingOperationId);
      expect(stakingOperation.getStatus()).toBe(StakingOperationStatusEnum.Initialized);
      expect(stakingOperation.getNetworkID()).toBe(networkId);
      expect(stakingOperation.getAddressID()).toBe(addressId);
    });

    it("should fetch staking operation with walletId", async () => {
      Coinbase.apiClients.walletStake!.getStakingOperation = jest.fn().mockResolvedValue({
        data: mockStakingOperationModel,
      });

      const stakingOperation = await StakingOperation.fetch(
        networkId,
        addressId,
        stakingOperationId,
        walletId,
      );

      expect(Coinbase.apiClients.walletStake!.getStakingOperation).toHaveBeenCalledWith(
        walletId,
        addressId,
        stakingOperationId,
      );
      expect(stakingOperation.getID()).toBe(stakingOperationId);
      expect(stakingOperation.getStatus()).toBe(StakingOperationStatusEnum.Initialized);
      expect(stakingOperation.getNetworkID()).toBe(networkId);
      expect(stakingOperation.getAddressID()).toBe(addressId);
    });

    it("should throw an error if walletId is empty", async () => {
      await expect(
        StakingOperation.fetch(networkId, addressId, stakingOperationId, ""),
      ).rejects.toThrow("Invalid wallet ID");
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
      expect(stakingOperation.getStatus()).toBe(StakingOperationStatusEnum.Initialized);
      expect(stakingOperation.getNetworkID()).toBe(Coinbase.networks.EthereumHoodi);
      expect(stakingOperation.isTerminalState()).toBe(false);
      expect(stakingOperation.getTransactions().length).toBe(1);
      expect(stakingOperation.getSignedVoluntaryExitMessages().length).toBe(0);
    });
  });

  describe("StakingOperation.loadTransactionsFromModel", () => {
    it("should not add duplicate transactions", () => {
      // Step 1: Set up a staking operation object with 2 unsigned transactions
      const modelWithInitialTransactions = {
        ...VALID_STAKING_OPERATION_MODEL,
        transactions: [
          {
            network_id: Coinbase.networks.EthereumHoodi,
            from_address_id: "dummy-from-address-id",
            to_address_id: "dummy-to-address-id",
            unsigned_payload: "payload1",
            transaction_hash: "0xdummy-transaction-hash",
            transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
            status: TransactionStatusEnum.Pending,
          },
          {
            network_id: Coinbase.networks.EthereumHoodi,
            from_address_id: "dummy-from-address-id",
            to_address_id: "dummy-to-address-id",
            unsigned_payload: "payload2",
            transaction_hash: "0xdummy-transaction-hash",
            transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
            status: TransactionStatusEnum.Pending,
          },
          {
            network_id: Coinbase.networks.EthereumHoodi,
            from_address_id: "dummy-from-address-id",
            to_address_id: "dummy-to-address-id",
            unsigned_payload: "payload3",
            transaction_hash: "0xdummy-transaction-hash",
            transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
            status: TransactionStatusEnum.Pending,
          },
        ],
      };

      const op = new StakingOperation(modelWithInitialTransactions);

      // Step 2: Mark payload1 and payload2 as signed
      op.getTransactions()
        .slice(0, 2)
        .forEach(tx => {
          tx.sign = jest.fn().mockResolvedValue(true);
          tx.isSigned = jest.fn().mockReturnValue(true);
        });

      // Step 3: Call reload and add two new transactions (payload4 and payload5)
      op["model"].transactions.push(
        {
          network_id: Coinbase.networks.EthereumHoodi,
          from_address_id: "dummy-from-address-id",
          to_address_id: "dummy-to-address-id",
          unsigned_payload: "payload4",
          transaction_hash: "0xdummy-transaction-hash",
          transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
          status: TransactionStatusEnum.Pending,
        },
        {
          network_id: Coinbase.networks.EthereumHoodi,
          from_address_id: "dummy-from-address-id",
          to_address_id: "dummy-to-address-id",
          unsigned_payload: "payload5",
          transaction_hash: "0xdummy-transaction-hash",
          transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
          status: TransactionStatusEnum.Pending,
        },
      );

      op["loadTransactionsFromModel"]();

      // Step 4: Ensure the final state has 5 transactions, with payload1 and payload2 still signed, and payload3, payload4, and payload5 unsigned
      expect(op.getTransactions().length).toEqual(5);
      expect(op.getTransactions()[0].isSigned()).toBe(true);
      expect(op.getTransactions()[1].isSigned()).toBe(true);
      expect(op.getTransactions()[2].isSigned()).toBe(false);
      expect(op.getTransactions()[3].isSigned()).toBe(false);
      expect(op.getTransactions()[4].isSigned()).toBe(false);
    });
  });
});

import { waitForUserOperation } from "./waitForUserOperation";
import { Coinbase } from "../coinbase/coinbase";
import { UserOperationStatusEnum } from "../client";
import { smartWalletApiMock, mockReturnValue } from "../tests/utils";
import * as waitUtils from "../utils/wait";

describe("waitForUserOperation", () => {
  const VALID_WALLET_ADDRESS = "0x1234567890123456789012345678901234567890" as const;

  const VALID_OPERATION_ID = "op123";
  const VALID_OPERATION_RESPONSE = {
    id: VALID_OPERATION_ID,
    status: UserOperationStatusEnum.Complete,
    transaction_hash: "0x1234567890123456789012345678901234567890",
    user_op_hash: "0x1234567890123456789012345678901234567890",
  };

  const FAILED_OPERATION_RESPONSE = {
    id: VALID_OPERATION_ID,
    smartWalletAddress: VALID_WALLET_ADDRESS,
    status: UserOperationStatusEnum.Failed,
    user_op_hash: "0x1234567890123456789012345678901234567890",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Coinbase.apiClients.smartWallet = smartWalletApiMock;
    Coinbase.apiClients.smartWallet!.getUserOperation = mockReturnValue(VALID_OPERATION_RESPONSE);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should successfully wait for a completed operation", async () => {
    const result = await waitForUserOperation({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
    });

    expect(Coinbase.apiClients.smartWallet!.getUserOperation).toHaveBeenCalledWith(
      VALID_WALLET_ADDRESS,
      VALID_OPERATION_ID,
    );

    expect(result).toEqual({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
      status: UserOperationStatusEnum.Complete,
      transactionHash: "0x1234567890123456789012345678901234567890",
      userOpHash: "0x1234567890123456789012345678901234567890",
    });
  });

  it("should successfully handle a failed operation", async () => {
    Coinbase.apiClients.smartWallet!.getUserOperation = mockReturnValue(FAILED_OPERATION_RESPONSE);

    const result = await waitForUserOperation({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
    });

    expect(Coinbase.apiClients.smartWallet!.getUserOperation).toHaveBeenCalledWith(
      VALID_WALLET_ADDRESS,
      VALID_OPERATION_ID,
    );

    expect(result).toEqual({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
      status: UserOperationStatusEnum.Failed,
      transactionHash: undefined,
      userOpHash: "0x1234567890123456789012345678901234567890",
    });
  });

  it("should use default timeout options when none are provided", async () => {
    const waitSpy = jest.spyOn(waitUtils, "wait");

    const result = await waitForUserOperation({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
    });

    expect(waitSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      { timeoutSeconds: 30 },
    );

    expect(result).toEqual({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
      status: UserOperationStatusEnum.Complete,
      transactionHash: "0x1234567890123456789012345678901234567890",
      userOpHash: "0x1234567890123456789012345678901234567890",
    });
  });

  it("should respect custom timeout options", async () => {
    const waitSpy = jest.spyOn(waitUtils, "wait");

    const result = await waitForUserOperation({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
      waitOptions: { timeoutSeconds: 1, intervalSeconds: 0.1 },
    });

    expect(waitSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      { timeoutSeconds: 1, intervalSeconds: 0.1 },
    );

    expect(result).toEqual({
      id: VALID_OPERATION_ID,
      smartWalletAddress: VALID_WALLET_ADDRESS,
      status: UserOperationStatusEnum.Complete,
      transactionHash: "0x1234567890123456789012345678901234567890",
      userOpHash: "0x1234567890123456789012345678901234567890",
    });
  });

  it("should throw an error if the operation is not terminal", async () => {
    Coinbase.apiClients.smartWallet!.getUserOperation = mockReturnValue({
      id: VALID_OPERATION_ID,
      status: UserOperationStatusEnum.Pending,
    });

    await expect(
      waitForUserOperation({
        id: VALID_OPERATION_ID,
        smartWalletAddress: VALID_WALLET_ADDRESS,
        waitOptions: { timeoutSeconds: 1 },
      }),
    ).rejects.toThrow(
      "Operation has not reached a terminal state after 1 seconds and may still succeed. Retry with a longer timeout using the timeoutSeconds option.",
    );
  });
});

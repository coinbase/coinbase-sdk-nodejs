import { sendUserOperation } from "./sendUserOperation";
import { Coinbase } from "../coinbase/coinbase";
import { encodeFunctionData, erc20Abi, parseEther } from "viem";
import { UserOperationStatusEnum } from "../client";
import { smartWalletApiMock, mockReturnValue, mockReturnRejectedValue } from "../tests/utils";

describe("sendUserOperation", () => {
  const VALID_WALLET = {
    address: "0x1234567890123456789012345678901234567890" as const,
    owners: [
      {
        address: "0x1234567890123456789012345678901234567890" as const,
        sign: jest.fn(),
      },
    ],
    type: "smart" as const,
    sendUserOperation: jest.fn(),
    useNetwork: jest.fn(),
  };

  const VALID_ABI_FUNCTION_CALL = {
    to: "0x2234567890123456789012345678901234567890",
    abi: erc20Abi,
    functionName: "transfer",
    args: ["0x3234567890123456789012345678901234567890", parseEther("1")],
    value: 0n,
  } as const;

  const VALID_ENCODED_CALL = {
    to: "0x4234567890123456789012345678901234567890" as const,
    data: "0x123abc",
    value: parseEther("0.1"),
  } as const;

  const VALID_CREATE_OPERATION_RESPONSE = {
    user_op_hash: "0x456def" as const,
  };

  const VALID_BROADCAST_RESPONSE = {
    status: UserOperationStatusEnum.Broadcast,
    user_op_hash: "0x456def" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    Coinbase.apiClients.smartWallet = smartWalletApiMock;

    Coinbase.apiClients.smartWallet!.createUserOperation = mockReturnValue(
      VALID_CREATE_OPERATION_RESPONSE,
    );
    Coinbase.apiClients.smartWallet!.broadcastUserOperation =
      mockReturnValue(VALID_BROADCAST_RESPONSE);
    VALID_WALLET.owners[0].sign.mockReturnValue("0x789ghi");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should successfully send a user operation with an ABI function call", async () => {
    const result = await sendUserOperation(VALID_WALLET, {
      calls: [VALID_ABI_FUNCTION_CALL],
      chainId: 8453,
    });

    expect(Coinbase.apiClients.smartWallet!.createUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      "base-mainnet",
      {
        calls: [
          {
            to: VALID_ABI_FUNCTION_CALL.to,
            data: encodeFunctionData({
              abi: VALID_ABI_FUNCTION_CALL.abi,
              functionName: VALID_ABI_FUNCTION_CALL.functionName,
              args: VALID_ABI_FUNCTION_CALL.args,
            }),
            value: "0",
          },
        ],
        paymaster_url: undefined,
      },
    );

    expect(Coinbase.apiClients.smartWallet!.broadcastUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      VALID_CREATE_OPERATION_RESPONSE.user_op_hash,
      {
        signature: "0x789ghi",
      },
    );

    expect(result).toEqual({
      smartWalletAddress: VALID_WALLET.address,
      status: VALID_BROADCAST_RESPONSE.status,
      userOpHash: VALID_BROADCAST_RESPONSE.user_op_hash,
    });
  });

  it("should successfully send a user operation with a encoded function call", async () => {
    const result = await sendUserOperation(VALID_WALLET, {
      calls: [VALID_ENCODED_CALL],
      chainId: 8453,
    });

    expect(Coinbase.apiClients.smartWallet!.createUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      "base-mainnet",
      {
        calls: [
          {
            to: VALID_ENCODED_CALL.to,
            data: VALID_ENCODED_CALL.data,
            value: VALID_ENCODED_CALL.value.toString(),
          },
        ],
        paymaster_url: undefined,
      },
    );

    expect(Coinbase.apiClients.smartWallet!.broadcastUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      VALID_CREATE_OPERATION_RESPONSE.user_op_hash,
      {
        signature: "0x789ghi",
      },
    );

    expect(result).toEqual({
      smartWalletAddress: VALID_WALLET.address,
      status: VALID_BROADCAST_RESPONSE.status,
      userOpHash: VALID_BROADCAST_RESPONSE.user_op_hash,
    });
  });

  it("should successfully send a user operation with multiple mixed calls", async () => {
    const result = await sendUserOperation(VALID_WALLET, {
      calls: [VALID_ABI_FUNCTION_CALL, VALID_ENCODED_CALL],
      chainId: 8453,
    });

    expect(Coinbase.apiClients.smartWallet!.createUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      "base-mainnet",
      {
        calls: [
          {
            to: VALID_ABI_FUNCTION_CALL.to,
            data: encodeFunctionData({
              abi: VALID_ABI_FUNCTION_CALL.abi,
              functionName: VALID_ABI_FUNCTION_CALL.functionName,
              args: VALID_ABI_FUNCTION_CALL.args,
            }),
            value: "0",
          },
          {
            to: VALID_ENCODED_CALL.to,
            data: VALID_ENCODED_CALL.data,
            value: VALID_ENCODED_CALL.value.toString(),
          },
        ],
        paymaster_url: undefined,
      },
    );

    expect(Coinbase.apiClients.smartWallet!.broadcastUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      VALID_CREATE_OPERATION_RESPONSE.user_op_hash,
      {
        signature: "0x789ghi",
      },
    );

    expect(result).toEqual({
      smartWalletAddress: VALID_WALLET.address,
      status: VALID_BROADCAST_RESPONSE.status,
      userOpHash: VALID_BROADCAST_RESPONSE.user_op_hash,
    });
  });

  it("should handle calls with undefined value property and set it to 0", async () => {
    const result = await sendUserOperation(VALID_WALLET, {
      calls: [{ ...VALID_ABI_FUNCTION_CALL, value: undefined }],
      chainId: 8453,
    });

    expect(Coinbase.apiClients.smartWallet!.createUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      "base-mainnet",
      {
        calls: [
          {
            to: VALID_ABI_FUNCTION_CALL.to,
            data: encodeFunctionData({
              abi: VALID_ABI_FUNCTION_CALL.abi,
              functionName: VALID_ABI_FUNCTION_CALL.functionName,
              args: VALID_ABI_FUNCTION_CALL.args,
            }),
            value: "0",
          },
        ],
        paymaster_url: undefined,
      },
    );

    expect(Coinbase.apiClients.smartWallet!.broadcastUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      VALID_CREATE_OPERATION_RESPONSE.user_op_hash,
      {
        signature: "0x789ghi",
      },
    );

    expect(result).toEqual({
      smartWalletAddress: VALID_WALLET.address,
      status: VALID_BROADCAST_RESPONSE.status,
      userOpHash: VALID_BROADCAST_RESPONSE.user_op_hash,
    });
  });

  it("should throw if calls array is empty", async () => {
    await expect(
      sendUserOperation(VALID_WALLET, {
        calls: [],
        chainId: 8453,
      }),
    ).rejects.toThrow("Calls array is empty");
  });

  it("should include paymaster URL when provided", async () => {
    const result = await sendUserOperation(VALID_WALLET, {
      calls: [VALID_ABI_FUNCTION_CALL],
      chainId: 8453,
      paymasterUrl: "https://paymaster.com",
    });

    expect(Coinbase.apiClients.smartWallet!.createUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      "base-mainnet",
      {
        calls: [
          {
            to: VALID_ABI_FUNCTION_CALL.to,
            data: encodeFunctionData({
              abi: VALID_ABI_FUNCTION_CALL.abi,
              functionName: VALID_ABI_FUNCTION_CALL.functionName,
              args: VALID_ABI_FUNCTION_CALL.args,
            }),
            value: "0",
          },
        ],
        paymaster_url: "https://paymaster.com",
      },
    );

    expect(Coinbase.apiClients.smartWallet!.broadcastUserOperation).toHaveBeenCalledWith(
      VALID_WALLET.address,
      VALID_CREATE_OPERATION_RESPONSE.user_op_hash,
      {
        signature: "0x789ghi",
      },
    );

    expect(result).toEqual({
      smartWalletAddress: VALID_WALLET.address,
      status: VALID_BROADCAST_RESPONSE.status,
      userOpHash: VALID_BROADCAST_RESPONSE.user_op_hash,
    });
  });

  it("should handle createUserOperation API errors", async () => {
    Coinbase.apiClients.smartWallet!.createUserOperation = mockReturnRejectedValue(
      new Error("API error"),
    );

    await expect(
      sendUserOperation(VALID_WALLET, {
        calls: [VALID_ABI_FUNCTION_CALL],
        chainId: 8453,
      }),
    ).rejects.toThrow("API error");
  });

  it("should handle broadcastUserOperation API errors", async () => {
    Coinbase.apiClients.smartWallet!.broadcastUserOperation = mockReturnRejectedValue(
      new Error("API error"),
    );

    await expect(
      sendUserOperation(VALID_WALLET, {
        calls: [VALID_ABI_FUNCTION_CALL],
        chainId: 8453,
      }),
    ).rejects.toThrow("API error");
  });

  it("should handle signature generation errors", async () => {
    VALID_WALLET.owners[0].sign.mockRejectedValue(new Error("Signature error"));

    await expect(
      sendUserOperation(VALID_WALLET, {
        calls: [VALID_ABI_FUNCTION_CALL],
        chainId: 8453,
      }),
    ).rejects.toThrow("Signature error");
  });
});

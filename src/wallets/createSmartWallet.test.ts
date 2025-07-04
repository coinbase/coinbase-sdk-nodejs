import { createSmartWallet } from "./createSmartWallet";
import { Coinbase } from "../coinbase/coinbase";
import type { Address } from "../types/misc";
import { smartWalletApiMock, mockReturnValue, mockReturnRejectedValue } from "../tests/utils";
import { sendUserOperation } from "../actions/sendUserOperation";

jest.mock("../actions/sendUserOperation", () => ({
  sendUserOperation: jest.fn(),
}));

describe("createSmartWallet", () => {
  const VALID_SIGNER = {
    address: "0x1234567890123456789012345678901234567890" as Address,
    sign: jest.fn(),
  };

  const VALID_CREATE_RESPONSE = {
    address: "0x2234567890123456789012345678901234567890" as Address,
    owners: [VALID_SIGNER.address],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    Coinbase.apiClients.smartWallet = smartWalletApiMock;
    Coinbase.apiClients.smartWallet!.createSmartWallet = mockReturnValue(VALID_CREATE_RESPONSE);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should successfully create a smart wallet", async () => {
    const result = await createSmartWallet({
      signer: VALID_SIGNER,
    });

    expect(Coinbase.apiClients.smartWallet!.createSmartWallet).toHaveBeenCalledWith({
      owner: VALID_SIGNER.address,
    });

    expect(result).toEqual({
      address: VALID_CREATE_RESPONSE.address,
      owners: [VALID_SIGNER],
      type: "smart",
      sendUserOperation: expect.any(Function),
      useNetwork: expect.any(Function),
    });
  });

  it("should create a wallet that can send user operations", async () => {
    const wallet = await createSmartWallet({
      signer: VALID_SIGNER,
    });

    const operationOptions = {
      calls: [
        {
          to: "0x3234567890123456789012345678901234567890" as Address,
          data: "0x123abc",
          value: 0n,
        },
      ],
      chainId: 8453,
    } as const;

    await wallet.sendUserOperation(operationOptions);

    expect(sendUserOperation).toHaveBeenCalledWith(wallet, operationOptions);
  });

  it("should create a wallet that can be network-scoped", async () => {
    const wallet = await createSmartWallet({
      signer: VALID_SIGNER,
    });

    const networkOptions = {
      chainId: 8453,
      paymasterUrl: "https://paymaster.example.com",
    } as const;

    const networkWallet = wallet.useNetwork(networkOptions);

    expect(networkWallet).toEqual({
      ...wallet,
      network: expect.objectContaining({
        chainId: networkOptions.chainId,
      }),
      paymasterUrl: networkOptions.paymasterUrl,
      sendUserOperation: expect.any(Function),
    });

    const operationOptions = {
      calls: [
        {
          to: "0x3234567890123456789012345678901234567890" as Address,
          data: "0x123abc",
          value: 0n,
        },
      ],
    } as const;

    await networkWallet.sendUserOperation(operationOptions);

    expect(sendUserOperation).toHaveBeenCalledWith(wallet, {
      ...operationOptions,
      chainId: networkOptions.chainId,
    });
  });

  it("should throw if API client is not initialized", async () => {
    Coinbase.apiClients.smartWallet = undefined;

    await expect(
      createSmartWallet({
        signer: VALID_SIGNER,
      }),
    ).rejects.toThrow();
  });

  it("should handle API errors during creation", async () => {
    Coinbase.apiClients.smartWallet!.createSmartWallet = mockReturnRejectedValue(
      new Error("Failed to create smart wallet"),
    );

    await expect(
      createSmartWallet({
        signer: VALID_SIGNER,
      }),
    ).rejects.toThrow("Failed to create smart wallet");
  });
});

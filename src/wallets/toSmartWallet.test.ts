import { sendUserOperation } from "../actions/sendUserOperation";
import { createNetwork } from "../utils/chain";
import { toSmartWallet } from "./toSmartWallet";
import type { Address } from "../types/misc";

jest.mock("../actions/sendUserOperation", () => ({
  sendUserOperation: jest.fn(),
}));

describe("toSmartWallet", () => {
  const VALID_SIGNER = {
    address: "0x1234567890123456789012345678901234567890" as Address,
    sign: jest.fn(),
  };

  const SMART_WALLET_ADDRESS = "0x2234567890123456789012345678901234567890" as Address;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a smart wallet instance with correct properties", () => {
    const wallet = toSmartWallet({
      smartWalletAddress: SMART_WALLET_ADDRESS,
      signer: VALID_SIGNER,
    });

    expect(wallet).toEqual({
      address: SMART_WALLET_ADDRESS,
      owners: [VALID_SIGNER],
      type: "smart",
      sendUserOperation: expect.any(Function),
      useNetwork: expect.any(Function),
    });
  });

  it("should properly handle sendUserOperation calls", async () => {
    const wallet = toSmartWallet({
      smartWalletAddress: SMART_WALLET_ADDRESS,
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

  describe("useNetwork", () => {
    const networkOptions = {
      chainId: 8453,
      paymasterUrl: "https://paymaster.example.com",
    } as const;

    it("should create a network-scoped wallet with correct properties", () => {
      const wallet = toSmartWallet({
        smartWalletAddress: SMART_WALLET_ADDRESS,
        signer: VALID_SIGNER,
      });

      const networkWallet = wallet.useNetwork(networkOptions);
      const expectedNetwork = createNetwork(networkOptions.chainId);

      expect(networkWallet).toEqual({
        address: SMART_WALLET_ADDRESS,
        owners: [VALID_SIGNER],
        type: "smart",
        network: expectedNetwork,
        paymasterUrl: networkOptions.paymasterUrl,
        sendUserOperation: expect.any(Function),
        useNetwork: expect.any(Function),
      });
    });

    it("should properly handle sendUserOperation calls with network context", async () => {
      const wallet = toSmartWallet({
        smartWalletAddress: SMART_WALLET_ADDRESS,
        signer: VALID_SIGNER,
      });

      const networkWallet = wallet.useNetwork(networkOptions);

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
    it("should preserve network context when sending multiple operations", async () => {
      const wallet = toSmartWallet({
        smartWalletAddress: SMART_WALLET_ADDRESS,
        signer: VALID_SIGNER,
      });

      const networkWallet = wallet.useNetwork(networkOptions);

      const operationOptions1 = {
        calls: [
          {
            to: "0x3234567890123456789012345678901234567890" as Address,
            data: "0x123abc",
            value: 0n,
          },
        ],
      } as const;

      const operationOptions2 = {
        calls: [
          {
            to: "0x4234567890123456789012345678901234567890" as Address,
            data: "0x456def",
            value: 0n,
          },
        ],
      } as const;

      await networkWallet.sendUserOperation(operationOptions1);
      await networkWallet.sendUserOperation(operationOptions2);

      expect(sendUserOperation).toHaveBeenCalledTimes(2);
      expect(sendUserOperation).toHaveBeenNthCalledWith(1, wallet, {
        ...operationOptions1,
        chainId: networkOptions.chainId,
      });
      expect(sendUserOperation).toHaveBeenNthCalledWith(2, wallet, {
        ...operationOptions2,
        chainId: networkOptions.chainId,
      });
    });

    it("should correctly handle different network chains", () => {
      const wallet = toSmartWallet({
        smartWalletAddress: SMART_WALLET_ADDRESS,
        signer: VALID_SIGNER,
      });

      const baseMainnet = wallet.useNetwork({
        chainId: 8453,
        paymasterUrl: "https://paymaster.example.com",
      });

      const baseSepolia = wallet.useNetwork({
        chainId: 84532,
        paymasterUrl: "https://paymaster-goerli.example.com",
      });

      expect(baseMainnet.network).toEqual(createNetwork(8453));
      expect(baseSepolia.network).toEqual(createNetwork(84532));
    });
  });
});

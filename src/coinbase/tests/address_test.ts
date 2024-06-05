import { Address } from "./../address";
import * as crypto from "crypto";
import { ethers } from "ethers";
import { FaucetTransaction } from "./../faucet_transaction";
import { Balance as BalanceModel, TransferList } from "../../client";
import Decimal from "decimal.js";
import { APIError, FaucetLimitReachedError } from "../api_error";
import { Coinbase } from "../coinbase";
import { InternalError } from "../errors";
import {
  VALID_ADDRESS_BALANCE_LIST,
  VALID_ADDRESS_MODEL,
  VALID_TRANSFER_MODEL,
  addressesApiMock,
  generateRandomHash,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  transfersApiMock,
} from "./utils";
import { ArgumentError } from "../errors";
import { Transfer } from "../transfer";
import { TransferStatus } from "../types";

// Test suite for Address class
describe("Address", () => {
  const transactionHash = generateRandomHash();
  let address: Address;
  let balanceModel: BalanceModel;
  let key;

  beforeAll(() => {
    Coinbase.apiClients.address = addressesApiMock;
    Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
      const { asset_id } = request;
      balanceModel = {
        amount: "1000000000000000000",
        asset: {
          asset_id,
          network_id: Coinbase.networks.BaseSepolia,
        },
      };
      return { data: balanceModel };
    });
    Coinbase.apiClients.address!.listAddressBalances = mockFn(() => {
      return { data: VALID_ADDRESS_BALANCE_LIST };
    });
    Coinbase.apiClients.address!.requestFaucetFunds = mockFn(() => {
      return { data: { transaction_hash: transactionHash } };
    });
  });

  beforeEach(() => {
    key = ethers.Wallet.createRandom();
    address = new Address(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);

    jest.clearAllMocks();
  });

  it("should initialize a new Address", () => {
    expect(address).toBeInstanceOf(Address);
  });

  it("should return the address ID", () => {
    expect(address.getId()).toBe(VALID_ADDRESS_MODEL.address_id);
  });

  it("should return the network ID", () => {
    expect(address.getNetworkId()).toBe(VALID_ADDRESS_MODEL.network_id);
  });

  it("should return the correct list of balances", async () => {
    const balances = await address.listBalances();
    expect(balances.get(Coinbase.assets.Eth)).toEqual(new Decimal(1));
    expect(balances.get("usdc")).toEqual(new Decimal(5000));
    expect(balances.get("weth")).toEqual(new Decimal(3));
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.listAddressBalances).toHaveBeenCalledTimes(1);
  });

  it("should return the correct ETH balance", async () => {
    const ethBalance = await address.getBalance(Coinbase.assets.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Gwei balance", async () => {
    const assetId = "gwei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000"));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Wei balance", async () => {
    const assetId = "wei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000000000000"));
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.address!.getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return an error for an unsupported asset", async () => {
    const getAddressBalance = mockReturnRejectedValue(new APIError(""));
    const assetId = "unsupported-asset";
    Coinbase.apiClients.address!.getAddressBalance = getAddressBalance;
    await expect(address.getBalance(assetId)).rejects.toThrow(APIError);
    expect(getAddressBalance).toHaveBeenCalledWith(address.getWalletId(), address.getId(), assetId);
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the wallet ID", () => {
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an InternalError when model is not provided", () => {
    expect(() => new Address(null!, key as unknown as ethers.Wallet)).toThrow(
      `Address model cannot be empty`,
    );
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an APIError when the request is unsuccesful", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(new APIError(""));
    await expect(address.faucet()).rejects.toThrow(APIError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledWith(
      address.getWalletId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new FaucetLimitReachedError(""),
    );
    await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    Coinbase.apiClients.address!.requestFaucetFunds = mockReturnRejectedValue(
      new InternalError(""),
    );
    await expect(address.faucet()).rejects.toThrow(InternalError);
    expect(Coinbase.apiClients.address!.requestFaucetFunds).toHaveBeenCalledTimes(1);
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `Coinbase:Address{addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}'}`,
    );
  });

  describe(".createTransfer", () => {
    let weiAmount, destination, intervalSeconds, timeoutSeconds;
    let walletId, id;

    beforeEach(() => {
      weiAmount = new Decimal("500000000000000000");
      destination = new Address(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);
      intervalSeconds = 0.2;
      timeoutSeconds = 10;
      walletId = crypto.randomUUID();
      id = crypto.randomUUID();
      Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
        const { asset_id } = request;
        balanceModel = {
          amount: "1000000000000000000",
          asset: {
            asset_id,
            network_id: Coinbase.networks.BaseSepolia,
          },
        };
        return { data: balanceModel };
      });

      Coinbase.apiClients.transfer = transfersApiMock;
    });

    it("should successfully create and complete a transfer", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await address.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should throw an APIError if the createTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnRejectedValue(
        new APIError("Failed to create transfer"),
      );
      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(APIError);
    });

    it("should throw an InternalError if the address key is not provided", async () => {
      const addressWithoutKey = new Address(VALID_ADDRESS_MODEL, null!);
      await expect(
        addressWithoutKey.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(InternalError);
    });

    it("should throw an APIError if the broadcastTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(APIError);
    });

    it("should throw an Error if the transfer times out", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.BROADCAST,
      });
      intervalSeconds = 0.000002;
      timeoutSeconds = 0.000002;

      await expect(
        address.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow("Transfer timed out");
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        address.createTransfer(
          insufficientAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create and complete a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await address.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe(".getTransfers", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const pages = ["abc", "def"];
      const response = {
        data: [VALID_TRANSFER_MODEL],
        has_more: false,
        next_page: "",
        total_count: 0,
      } as TransferList;
      Coinbase.apiClients.transfer!.listTransfers = mockFn((walletId, addressId) => {
        VALID_TRANSFER_MODEL.wallet_id = walletId;
        VALID_TRANSFER_MODEL.address_id = addressId;
        response.next_page = pages.shift() as string;
        response.data = [VALID_TRANSFER_MODEL];
        response.has_more = !!response.next_page;
        return { data: response };
      });
    });

    it("should return the list of transfers", async () => {
      const transfers = await address.getTransfers();
      expect(transfers).toHaveLength(3);
      expect(transfers[0]).toBeInstanceOf(Transfer);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(3);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        100,
        undefined,
      );
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        100,
        "abc",
      );
    });

    it("should raise an APIError when the API call fails", async () => {
      jest.clearAllMocks();
      Coinbase.apiClients.transfer!.listTransfers = mockReturnRejectedValue(new APIError(""));
      await expect(address.getTransfers()).rejects.toThrow(APIError);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(1);
    });
  });
});

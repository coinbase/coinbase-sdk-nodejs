import axios, { AxiosInstance } from "axios";
import { ethers } from "ethers";
import { randomUUID } from "crypto";
import {
  Configuration,
  Wallet as WalletModel,
  Balance as BalanceModel,
  AddressBalanceList,
  Address as AddressModel,
} from "../../client";
import { BASE_PATH } from "../../client/base";
import { Coinbase } from "../coinbase";
import { registerAxiosInterceptors } from "../utils";

export const walletId = randomUUID();

// newAddressModel creates a new AddressModel with a random wallet ID and a random Ethereum address.
export const newAddressModel = (walletId: string): AddressModel => {
  const ethAddress = ethers.Wallet.createRandom();

  return {
    address_id: ethAddress.address,
    network_id: Coinbase.networkList.BaseSepolia,
    public_key: ethAddress.publicKey,
    wallet_id: walletId,
  };
};

export const VALID_ADDRESS_MODEL = newAddressModel(randomUUID());

export const VALID_WALLET_MODEL: WalletModel = {
  id: randomUUID(),
  network_id: Coinbase.networkList.BaseSepolia,
  default_address: {
    wallet_id: walletId,
    address_id: "0xdeadbeef",
    public_key: "0x1234567890",
    network_id: Coinbase.networkList.BaseSepolia,
  },
};

export const VALID_ADDRESS_BALANCE_LIST: AddressBalanceList = {
  data: [
    {
      amount: "1000000000000000000",
      asset: {
        asset_id: Coinbase.assetList.Eth,
        network_id: Coinbase.networkList.BaseSepolia,
        decimals: 18,
      },
    },
    {
      amount: "5000000000",
      asset: {
        asset_id: "usdc",
        network_id: Coinbase.networkList.BaseSepolia,
        decimals: 6,
      },
    },
    {
      amount: "3000000000000000000",
      asset: {
        asset_id: "weth",
        network_id: Coinbase.networkList.BaseSepolia,
        decimals: 6,
      },
    },
  ],
  has_more: false,
  next_page: "",
  total_count: 3,
};

export const VALID_BALANCE_MODEL: BalanceModel = {
  amount: "1000000000000000000",
  asset: {
    asset_id: Coinbase.assetList.Eth,
    network_id: Coinbase.networkList.BaseSepolia,
  },
};

/**
 * AxiosMockReturn type. Represents the Axios instance, configuration, and base path.
 */
type AxiosMockType = [AxiosInstance, Configuration, string];

/**
 * Returns an Axios instance with interceptors and configuration for testing.
 *
 * @returns {AxiosMockType} - The Axios instance, configuration, and base path.
 */
export const createAxiosMock = (): AxiosMockType => {
  const axiosInstance = axios.create();
  registerAxiosInterceptors(
    axiosInstance,
    request => request,
    response => response,
  );
  const configuration = new Configuration();
  return [axiosInstance, configuration, BASE_PATH];
};

export const usersApiMock = {
  getCurrentUser: jest.fn().mockResolvedValue({ data: { id: 123 } }),
};

export const walletsApiMock = {
  getWallet: jest.fn().mockResolvedValue(Promise.resolve({ data: VALID_WALLET_MODEL })),
  createWallet: jest.fn().mockResolvedValue(Promise.resolve({ data: VALID_WALLET_MODEL })),
};

export const addressesApiMock = {
  requestFaucetFunds: jest.fn().mockResolvedValue({ data: { transaction_hash: "0xdeadbeef" } }),
  getAddress: jest.fn().mockResolvedValue({ data: VALID_ADDRESS_BALANCE_LIST }),
  getAddressBalance: jest.fn().mockResolvedValue({ data: { VALID_BALANCE_MODEL } }),
  listAddressBalances: jest.fn().mockResolvedValue({ data: VALID_ADDRESS_BALANCE_LIST }),
  createAddress: jest.fn().mockResolvedValue({ data: VALID_WALLET_MODEL.default_address }),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const mockFn = (...args) => jest.fn(...args) as any;
export const mockReturnValue = data => jest.fn().mockResolvedValue({ data });
export const mockReturnRejectedValue = data => jest.fn().mockRejectedValue(data);

export const walletId = randomUUID();

export const generateRandomHash = (length = 8) => {
  const characters = "abcdef0123456789";
  let hash = "0x";
  for (let i = 0; i < length; i++) {
    hash += characters[Math.floor(Math.random() * characters.length)];
  }
  return hash;
};

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
 * @returns The Axios instance, configuration, and base path.
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
  getCurrentUser: jest.fn(),
};

export const walletsApiMock = {
  getWallet: jest.fn(),
  createWallet: jest.fn(),
};

export const addressesApiMock = {
  requestFaucetFunds: jest.fn(),
  getAddress: jest.fn(),
  getAddressBalance: jest.fn(),
  listAddressBalances: jest.fn(),
  createAddress: jest.fn(),
};

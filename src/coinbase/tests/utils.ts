/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from "axios";
import { Decimal } from "decimal.js";
import { ethers } from "ethers";
import { randomUUID } from "crypto";
import {
  Configuration,
  Wallet as WalletModel,
  Balance as BalanceModel,
  AddressBalanceList,
  Address as AddressModel,
  Transfer as TransferModel,
  TransferStatusEnum,
} from "../../client";
import { BASE_PATH } from "../../client/base";
import { Coinbase } from "../coinbase";
import { convertStringToHex, registerAxiosInterceptors } from "../utils";
import { HDKey } from "@scure/bip32";

export const mockFn = (...args) => jest.fn(...args) as any;
export const mockReturnValue = data => jest.fn().mockResolvedValue({ data });
export const mockReturnRejectedValue = data => jest.fn().mockRejectedValue(data);

export const getAddressFromHDKey = (hdKey: HDKey): string => {
  return new ethers.Wallet(convertStringToHex(hdKey.privateKey!)).address;
};

export const walletId = randomUUID();
export const transferId = randomUUID();

export const generateRandomHash = (length = 8) => {
  const characters = "abcdef0123456789";
  let hash = "0x";
  for (let i = 0; i < length; i++) {
    hash += characters[Math.floor(Math.random() * characters.length)];
  }
  return hash;
};

// newAddressModel creates a new AddressModel with a random wallet ID and a random Ethereum address.
export const newAddressModel = (walletId: string, address_id: string = ""): AddressModel => {
  const ethAddress = ethers.Wallet.createRandom();

  return {
    address_id: address_id ? address_id : ethAddress.address,
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

export const VALID_TRANSFER_MODEL: TransferModel = {
  transfer_id: transferId,
  network_id: Coinbase.networkList.BaseSepolia,
  wallet_id: walletId,
  address_id: ethers.Wallet.createRandom().address,
  destination: "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b",
  asset_id: Coinbase.assetList.Eth,
  amount: new Decimal(ethers.parseUnits("100", 18).toString()).toString(),
  unsigned_payload:
    "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e63" +
    "65223a22307830222c22746f223a22307834643965346633663464316138623566346637623166" +
    "356235633762386436623262336231623062222c22676173223a22307835323038222c22676173" +
    "5072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a223078" +
    "3539363832663030222c226d6178466565506572476173223a2230783539363832663030222c22" +
    "76616c7565223a2230783536626337356532643633313030303030222c22696e707574223a22" +
    "3078222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a2230783022" +
    "2c2273223a22307830222c2279506172697479223a22307830222c2268617368223a2230783664" +
    "633334306534643663323633653363396561396135656438646561346332383966613861363966" +
    "3031653635393462333732386230386138323335333433227d",
  status: TransferStatusEnum.Pending,
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
  listWallets: jest.fn(),
  listWalletBalances: jest.fn(),
  getWalletBalance: jest.fn(),
};

export const addressesApiMock = {
  requestFaucetFunds: jest.fn(),
  getAddress: jest.fn(),
  listAddresses: jest.fn(),
  getAddressBalance: jest.fn(),
  listAddressBalances: jest.fn(),
  createAddress: jest.fn(),
};

export const transfersApiMock = {
  broadcastTransfer: jest.fn(),
  createTransfer: jest.fn(),
  getTransfer: jest.fn(),
  listTransfers: jest.fn(),
};

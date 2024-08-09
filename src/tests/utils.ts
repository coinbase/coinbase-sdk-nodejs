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
  StakingOperation as StakingOperationModel,
  ValidatorList,
  Validator,
  StakingOperationStatusEnum,
} from "../client";
import { BASE_PATH } from "../client/base";
import { Coinbase } from "../coinbase/coinbase";
import { convertStringToHex, registerAxiosInterceptors } from "../coinbase/utils";
import { HDKey } from "@scure/bip32";

export const mockFn = (...args) => jest.fn(...args) as any;
export const mockReturnValue = data => jest.fn().mockResolvedValue({ data });
export const mockReturnRejectedValue = data => jest.fn().mockRejectedValue(data);

export const getAddressFromHDKey = (hdKey: HDKey): string => {
  return new ethers.Wallet(convertStringToHex(hdKey.privateKey!)).address;
};

export const mockListAddress = (seed: string, count = 1) => {
  const { wallet1PrivateKey, ...rest } = generateWalletFromSeed(seed, 3);

  const addressList = Array.from({ length: count }, (_, i) => {
    return {
      address_id: rest[`address${i + 1}`],
      network_id: Coinbase.networks.BaseSepolia,
      public_key: wallet1PrivateKey,
      wallet_id: randomUUID(),
    };
  });

  Coinbase.apiClients.address!.listAddresses = mockFn(() => {
    return {
      data: {
        data: addressList,
        has_more: false,
        next_page: "",
        total_count: count,
      },
    };
  });
  return addressList;
};

export const walletId = randomUUID();
export const transferId = randomUUID();

export const generateWalletFromSeed = (seed: string, count = 2) => {
  const baseWallet = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
  const data: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    const wallet = baseWallet.derive(`m/44'/60'/0'/0/${i}`);
    data[`wallet${i + 1}`] = getAddressFromHDKey(wallet);
    data[`wallet${i + 1}PrivateKey`] = convertStringToHex(wallet.privateKey!);
    data[`address${i + 1}`] = getAddressFromHDKey(wallet);
  }
  return data;
};

export const generateRandomHash = (length = 8) => {
  const characters = "abcdef0123456789";
  let hash = "0x";
  for (let i = 0; i < length; i++) {
    hash += characters[Math.floor(Math.random() * characters.length)];
  }
  return hash;
};

// newAddressModel creates a new AddressModel with a random wallet ID and a random Ethereum address.
export const newAddressModel = (
  walletId: string,
  address_id: string = "",
  network_id: string = Coinbase.networks.BaseSepolia,
): AddressModel => {
  const ethAddress = ethers.Wallet.createRandom();

  return {
    address_id: address_id ? address_id : ethAddress.address,
    network_id: network_id ? network_id : Coinbase.networks.BaseSepolia,
    public_key: ethAddress.publicKey,
    wallet_id: walletId,
  };
};

export const VALID_ADDRESS_MODEL = newAddressModel(randomUUID());

export const VALID_WALLET_MODEL: WalletModel = {
  id: randomUUID(),
  network_id: Coinbase.networks.BaseSepolia,
  enabled_features: [],
  default_address: {
    wallet_id: walletId,
    address_id: "0xdeadbeef",
    public_key: "0x1234567890",
    network_id: Coinbase.networks.BaseSepolia,
  },
};

export const VALID_TRANSFER_MODEL: TransferModel = {
  transfer_id: transferId,
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  asset: {
    asset_id: Coinbase.assets.Eth,
    network_id: Coinbase.networks.BaseSepolia,
    decimals: 18,
    contract_address: "0x",
  },
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
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
    transaction_hash: "0xdeadbeef",
    transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
    status: "pending",
  },
  address_id: ethers.Wallet.createRandom().address,
  destination: "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b",
  asset_id: Coinbase.assets.Eth,
  amount: new Decimal(ethers.parseUnits("100", 18).toString()).toString(),
};

export const VALID_STAKING_OPERATION_MODEL: StakingOperationModel = {
  id: "some-id",
  network_id: Coinbase.networks.EthereumHolesky,
  address_id: "some-address-id",
  status: "pending",
  transactions: [
    {
      network_id: Coinbase.networks.EthereumHolesky,
      from_address_id: "0xdeadbeef",
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
      transaction_hash: "0xdeadbeef",
      transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
      status: "pending",
    },
  ],
};

/**
 * mockStakingOperation returns a mock StakingOperation object with the provided status.
 *
 * @param status - The status of the validator.
 *
 * @returns The mock StakingOperationModel object.
 */
export function mockStakingOperation(status: StakingOperationStatusEnum): StakingOperationModel {
  return {
    id: "some-id",
    network_id: Coinbase.networks.EthereumHolesky,
    address_id: "some-address-id",
    status: status,
    transactions: [
      {
        network_id: Coinbase.networks.EthereumHolesky,
        from_address_id: "0xdeadbeef",
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
        transaction_hash: "0xdeadbeef",
        transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
        status: "pending",
      },
    ],
  };
}

export const VALID_NATIVE_ETH_UNSTAKE_OPERATION_MODEL: StakingOperationModel = {
  id: randomUUID(),
  network_id: Coinbase.networks.BaseSepolia,
  address_id: "0x1234567890",
  status: "complete",
  transactions: [],
  metadata: [
    {
      fork: "some-fork",
      signed_voluntary_exit:
        "eyJtZXNzYWdlIjp7ImVwb2NoIjoiNjU1MTQiLCJ2YWxpZGF0b3JfaW5kZXgiOiIxNzQ3MTM3In0sInNpZ25hdHVyZSI6IjB4YTAxODM0NmM3YWNkZmEwOTVhM2UyY2E1ZDZlMDM0NmUzNDhhN2IwOTk1MWU1MmI0ZjdiYjk1MmY2ODgxZjdmY2EyODM0YWViNjFjOGQ4NzMxMTFkNzBmYmNiYzUwNWQwMDM2MmM1NjBjYTdjMTk3ZWM3MTU0OTU2NzE0ZDIzODU1YWYyNTljOTcxODgxMjI3NWI3NmU2MTRiMDljMzVlMGUwMzA3MmI2NzUwNjkyZjBmMjcwNWM1ZGEyNmY4YWQ0In0K",
      validator_pub_key: "0x1234567890",
    },
  ],
};

export const VALID_ADDRESS_BALANCE_LIST: AddressBalanceList = {
  data: [
    {
      amount: "1000000000000000000",
      asset: {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 18,
        contract_address: "0x",
      },
    },
    {
      amount: "5000000000",
      asset: {
        asset_id: "usdc",
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "0x",
        decimals: 6,
      },
    },
    {
      amount: "3000000000000000000",
      asset: {
        asset_id: "weth",
        network_id: Coinbase.networks.BaseSepolia,
        contract_address: "0x",
        decimals: 18,
      },
    },
  ],
  has_more: false,
  next_page: "",
  total_count: 3,
};

/**
 * mockEthereumValidator returns a mock EthereumValidator object with the provided index and status.
 *
 * @param index - The index of the validator.
 * @param status - The status of the validator.
 * @param public_key - The public key of the validator.
 *
 * @returns The mock EthereumValidator object.
 */
export function mockEthereumValidator(
  index: string,
  status: string,
  public_key: string,
): Validator {
  return {
    validator_id: public_key,
    network_id: "ethereum-holesky",
    asset_id: "eth",
    status: status,
    details: {
      index: index,
      public_key: public_key,
      withdrawl_address: "0xwithdrawl_address_1",
      slashed: false,
      activationEpoch: "10",
      exitEpoch: "10",
      withdrawableEpoch: "10",
      balance: {
        amount: "32000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.EthereumHolesky,
        },
      },
      effective_balance: {
        amount: "32000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.EthereumHolesky,
        },
      },
    },
  };
}

export const VALID_ACTIVE_VALIDATOR_LIST: ValidatorList = {
  data: [
    mockEthereumValidator("100", "active_ongoing", "0xpublic_key_1"),
    mockEthereumValidator("200", "active_ongoing", "0xpublic_key_2"),
    mockEthereumValidator("300", "active_ongoing", "0xpublic_key_3"),
  ],
  has_more: false,
  next_page: "",
};

export const VALID_EXITING_VALIDATOR_LIST: ValidatorList = {
  data: [
    mockEthereumValidator("400", "active_exiting", "0xpublic_key_4"),
    mockEthereumValidator("500", "active_exiting", "0xpublic_key_5"),
    mockEthereumValidator("600", "active_exiting", "0xpublic_key_6"),
  ],
  has_more: false,
  next_page: "",
};

export const VALID_BALANCE_MODEL: BalanceModel = {
  amount: "1000000000000000000",
  asset: {
    asset_id: Coinbase.assets.Eth,
    network_id: Coinbase.networks.BaseSepolia,
  },
};

/**
 * getAssetMock returns a mock function that returns an AssetModel with the provided network ID and asset ID.
 *
 * @returns The mock function.
 */
export const getAssetMock = () => {
  return mockFn((...request) => {
    const [network_id, asset_id] = request;
    const decimals = {
      wei: 18,
      gwei: 18,
      eth: 18,
      usdc: 6,
      weth: 18,
    };
    return {
      data: {
        network_id,
        asset_id: asset_id.includes("wei") ? "eth" : asset_id,
        decimals: decimals[asset_id],
        contract_address: "0x",
      },
    };
  });
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

export const assetsApiMock = {
  getAsset: jest.fn(),
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

export const tradeApiMock = {
  getTrade: jest.fn(),
  listTrades: jest.fn(),
  createTrade: jest.fn(),
  broadcastTrade: jest.fn(),
};

export const transfersApiMock = {
  broadcastTransfer: jest.fn(),
  createTransfer: jest.fn(),
  getTransfer: jest.fn(),
  listTransfers: jest.fn(),
};
// test
export const stakeApiMock = {
  buildStakingOperation: jest.fn(),
  getExternalStakingOperation: jest.fn(),
  getStakingContext: jest.fn(),
  fetchStakingRewards: jest.fn(),
  broadcastStakingOperation: jest.fn(),
  createStakingOperation: jest.fn(),
  getStakingOperation: jest.fn(),
};

export const validatorApiMock = {
  getValidator: jest.fn(),
  listValidators: jest.fn(),
};

export const externalAddressApiMock = {
  listExternalAddressBalances: jest.fn(),
  getExternalAddressBalance: jest.fn(),
  requestExternalFaucetFunds: jest.fn(),
};

export const serverSignersApiMock = {
  listServerSigners: jest.fn(),
};

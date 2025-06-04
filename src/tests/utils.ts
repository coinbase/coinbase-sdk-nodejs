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
  FaucetTransaction as FaucetTransactionModel,
  StakingOperation as StakingOperationModel,
  PayloadSignature as PayloadSignatureModel,
  CompiledSmartContract as CompiledSmartContractModel,
  PayloadSignatureList,
  PayloadSignatureStatusEnum,
  ContractInvocation as ContractInvocationModel,
  SmartContract as SmartContractModel,
  CryptoAmount as CryptoAmountModel,
  Asset as AssetModel,
  FundQuote as FundQuoteModel,
  FundOperation as FundOperationModel,
  SmartContractType,
  ValidatorList,
  Validator,
  StakingOperationStatusEnum,
  FeatureSet,
  TransactionStatusEnum,
  ValidatorStatus,
  NFTContractOptions as NFTContractOptionsModel,
  TokenContractOptions as TokenContractOptionsModel,
  MultiTokenContractOptions as MultiTokenContractOptionsModel,
} from "../client";
import { BASE_PATH } from "../client/base";
import { Coinbase } from "../coinbase/coinbase";
import { convertStringToHex, registerAxiosInterceptors } from "../coinbase/utils";
import { HDKey } from "@scure/bip32";
import { Asset } from "../coinbase/asset";
import { Wallet } from "../coinbase/wallet";

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
      index: i,
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

export const amount = "0";

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
  index: number = 0,
): AddressModel => {
  const ethAddress = ethers.Wallet.createRandom();

  return {
    address_id: address_id ? address_id : ethAddress.address,
    network_id: network_id ? network_id : Coinbase.networks.BaseSepolia,
    public_key: ethAddress.publicKey,
    wallet_id: walletId,
    index,
  };
};

export const newAddressModelsFromWallet = async (
  walletId: string,
  seed: string,
  network_id: string = Coinbase.networks.BaseSepolia,
): Promise<AddressModel[]> => {
  // create a new wallet with master seed
  const wallet = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
  const address1 = getAddressFromHDKey(wallet.derive("m/44'/60'/0'/0/0"));
  const address2 = getAddressFromHDKey(wallet.derive("m/44'/60'/0'/0/1"));
  const publicKey1 = convertStringToHex(wallet.derive("m/44'/60'/0'/0/0").publicKey!);
  const publicKey2 = convertStringToHex(wallet.derive("m/44'/60'/0'/0/1").publicKey!);

  return [
    {
      address_id: address1,
      network_id: network_id,
      public_key: publicKey1,
      wallet_id: walletId,
      index: 0,
    },
    {
      address_id: address2,
      network_id: network_id,
      public_key: publicKey2,
      wallet_id: walletId,
      index: 1,
    },
  ];
};

export const VALID_ADDRESS_MODEL = newAddressModel(randomUUID());

export const VALID_WALLET_MODEL: WalletModel = {
  id: randomUUID(),
  network_id: Coinbase.networks.BaseSepolia,
  feature_set: {} as FeatureSet,
  default_address: {
    wallet_id: walletId,
    address_id: "0xdeadbeef",
    public_key: "0x1234567890",
    network_id: Coinbase.networks.BaseSepolia,
    index: 0,
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
  gasless: false,
};

export const VALID_TRANSFER_SPONSORED_SEND_MODEL: TransferModel = {
  transfer_id: transferId,
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  asset: {
    asset_id: Coinbase.assets.Usdc,
    network_id: Coinbase.networks.BaseSepolia,
    decimals: 18,
    contract_address: "0xusdc",
  },
  sponsored_send: {
    to_address_id: "0xdeadbeef",
    raw_typed_data: "0xhash",
    typed_data_hash: "0x7523946e17c0b8090ee18c84d6f9a8d63bab4d579a6507f0998dde0791891823",
    transaction_hash: "0xdeadbeef",
    transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
    status: "pending",
  },
  address_id: ethers.Wallet.createRandom().address,
  destination: "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b",
  asset_id: Coinbase.assets.Eth,
  amount: new Decimal(ethers.parseUnits("100", 18).toString()).toString(),
  gasless: false,
};

export const VALID_STAKING_OPERATION_MODEL: StakingOperationModel = {
  id: "some-id",
  network_id: Coinbase.networks.EthereumHoodi,
  address_id: "some-address-id",
  status: StakingOperationStatusEnum.Initialized,
  transactions: [
    {
      network_id: Coinbase.networks.EthereumHoodi,
      from_address_id: "dummy-from-address-id",
      to_address_id: "dummy-to-address-id",
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
      transaction_hash: "0xdummy-transaction-hash",
      transaction_link: "https://sepolia.basescan.org/tx/0xdeadbeef",
      status: TransactionStatusEnum.Pending,
    },
  ],
};

export const VALID_PAYLOAD_SIGNATURE_MODEL: PayloadSignatureModel = {
  payload_signature_id: "test-payload-signature-id-1",
  wallet_id: walletId,
  address_id: ethers.Wallet.createRandom().address,
  unsigned_payload: "0x58f51af4cb4775cebe5853f0bf1e984927415e889a3d55ae6d243aeec46ffd10",
  status: PayloadSignatureStatusEnum.Pending,
};

export const VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL: PayloadSignatureModel = {
  ...VALID_PAYLOAD_SIGNATURE_MODEL,
  signature: "0x58f51af4cb4775cebe5853f0bf1e984927415e889a3d55ae6d243aeec46ffd10",
  status: PayloadSignatureStatusEnum.Signed,
};

export const VALID_PAYLOAD_SIGNATURE_LIST: PayloadSignatureList = {
  data: [
    VALID_PAYLOAD_SIGNATURE_MODEL,
    { ...VALID_PAYLOAD_SIGNATURE_MODEL, payload_signature_id: "test-payload-signature-id-2" },
    { ...VALID_PAYLOAD_SIGNATURE_MODEL, payload_signature_id: "test-payload-signature-id-3" },
    { ...VALID_PAYLOAD_SIGNATURE_MODEL, payload_signature_id: "test-payload-signature-id-4" },
  ],
  has_more: false,
  next_page: "",
  total_count: 4,
};

export const MINT_NFT_ABI = [
  {
    inputs: [{ internalType: "address", name: "recipient", type: "address" }],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
];

export const MINT_NFT_ARGS = { recipient: "0x475d41de7A81298Ba263184996800CBcaAD73C0b" };

const faucetTxHash = generateRandomHash(64);

export const VALID_FAUCET_TRANSACTION_MODEL: FaucetTransactionModel = {
  transaction_hash: faucetTxHash,
  transaction_link: "https://sepolia.basescan.org/tx/" + faucetTxHash,
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: ethers.Wallet.createRandom().address,
    unsigned_payload: "",
    transaction_hash: faucetTxHash,
    transaction_link: "https://sepolia.basescan.org/tx/" + faucetTxHash,
    status: TransactionStatusEnum.Pending,
  },
};

export const VALID_CONTRACT_INVOCATION_MODEL: ContractInvocationModel = {
  wallet_id: walletId,
  address_id: ethers.Wallet.createRandom().address,
  contract_invocation_id: "test-contract-invocation-1",
  network_id: Coinbase.networks.BaseSepolia,
  contract_address: "0xcontract-address",
  method: "mint",
  args: JSON.stringify(MINT_NFT_ARGS),
  abi: JSON.stringify(MINT_NFT_ABI),
  amount: "0",
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
    unsigned_payload:
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e6365223a22307830222c22746f223a22307861383261623835303466646562326461646161336234663037356539363762626533353036356239222c22676173223a22307865623338222c226761735072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a2230786634323430222c226d6178466565506572476173223a2230786634333638222c2276616c7565223a22307830222c22696e707574223a223078366136323738343230303030303030303030303030303030303030303030303034373564343164653761383132393862613236333138343939363830306362636161643733633062222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c2279506172697479223a22307830222c2268617368223a22307865333131636632303063643237326639313566656433323165663065376431653965353362393761346166623737336638653935646431343630653665326163227d",
    status: TransactionStatusEnum.Pending,
  },
};

export const VALID_SIGNED_CONTRACT_INVOCATION_MODEL: ContractInvocationModel = {
  ...VALID_CONTRACT_INVOCATION_MODEL,
  transaction: {
    ...VALID_CONTRACT_INVOCATION_MODEL.transaction,
    signed_payload:
      "02f88f83014a3480830f4240830f436882eb3894a82ab8504fdeb2dadaa3b4f075e967bbe35065b980a46a627842000000000000000000000000475d41de7a81298ba263184996800cbcaad73c0bc080a00bca053345d88d7cc02c257c5d74f8285bc6408c9020e1b4331779995f355c0ca04a8ec5bee1609d97f3ccba1e0d535441cf61c708e9bc632fe9963b34f97d0462",
    status: TransactionStatusEnum.Broadcast,
    transaction_hash: "0xdummy-transaction-hash",
    transaction_link: "https://sepolia.basescan.org/tx/0xdummy-transaction-hash",
  },
};

export const ERC20_NAME = "Test ERC20 Token";
export const ERC20_SYMBOL = "TEST";
export const ERC20_TOTAL_SUPPLY = 100;

export const VALID_SMART_CONTRACT_ERC20_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-1",
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  contract_name: ERC20_NAME,
  is_external: false,
  contract_address: "0xcontract-address",
  deployer_address: "0xdeployer-address",
  type: SmartContractType.Erc20,
  options: {
    name: ERC20_NAME,
    symbol: ERC20_SYMBOL,
    total_supply: ERC20_TOTAL_SUPPLY.toString(),
  } as TokenContractOptionsModel,
  abi: JSON.stringify("some-abi"),
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
    unsigned_payload:
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e6365223a22307830222c22746f223a22307861383261623835303466646562326461646161336234663037356539363762626533353036356239222c22676173223a22307865623338222c226761735072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a2230786634323430222c226d6178466565506572476173223a2230786634333638222c2276616c7565223a22307830222c22696e707574223a223078366136323738343230303030303030303030303030303030303030303030303034373564343164653761383132393862613236333138343939363830306362636161643733633062222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c2279506172697479223a22307830222c2268617368223a22307865333131636632303063643237326639313566656433323165663065376431653965353362393761346166623737336638653935646431343630653665326163227d",
    status: TransactionStatusEnum.Pending,
  },
};

export const VALID_EXTERNAL_SMART_CONTRACT_ERC20_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-1",
  network_id: Coinbase.networks.BaseSepolia,
  contract_name: ERC20_NAME,
  is_external: true,
  contract_address: "0xcontract-address",
  type: SmartContractType.Custom,
  abi: JSON.stringify("some-abi"),
};

export const ERC721_NAME = "Test NFT";
export const ERC721_SYMBOL = "TEST";
export const ERC721_BASE_URI = "https://example.com/metadata/";
export const VALID_SMART_CONTRACT_ERC721_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-1",
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  contract_name: ERC721_NAME,
  is_external: false,
  contract_address: "0xcontract-address",
  deployer_address: "0xdeployer-address",
  type: SmartContractType.Erc721,
  options: {
    name: ERC721_NAME,
    symbol: ERC721_SYMBOL,
    base_uri: ERC721_BASE_URI,
  } as NFTContractOptionsModel,
  abi: JSON.stringify("some-abi"),
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
    unsigned_payload:
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e6365223a22307830222c22746f223a22307861383261623835303466646562326461646161336234663037356539363762626533353036356239222c22676173223a22307865623338222c226761735072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a2230786634323430222c226d6178466565506572476173223a2230786634333638222c2276616c7565223a22307830222c22696e707574223a223078366136323738343230303030303030303030303030303030303030303030303034373564343164653761383132393862613236333138343939363830306362636161643733633062222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c2279506172697479223a22307830222c2268617368223a22307865333131636632303063643237326639313566656433323165663065376431653965353362393761346166623737336638653935646431343630653665326163227d",
    status: TransactionStatusEnum.Pending,
  },
};

export const ERC1155_URI = "https://example.com/{id}.json";
export const VALID_SMART_CONTRACT_ERC1155_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-1",
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  contract_name: "",
  is_external: false,
  contract_address: "0xcontract-address",
  deployer_address: "0xdeployer-address",
  type: SmartContractType.Erc1155,
  options: {
    uri: ERC1155_URI,
  } as MultiTokenContractOptionsModel,
  abi: JSON.stringify("some-abi"),
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
    unsigned_payload:
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e6365223a22307830222c22746f223a22307861383261623835303466646562326461646161336234663037356539363762626533353036356239222c22676173223a22307865623338222c226761735072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a2230786634323430222c226d6178466565506572476173223a2230786634333638222c2276616c7565223a22307830222c22696e707574223a223078366136323738343230303030303030303030303030303030303030303030303034373564343164653761383132393862613236333138343939363830306362636161643733633062222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c2279506172697479223a22307830222c2268617368223a22307865333131636632303063643237326639313566656433323165663065376431653965353362393761346166623737336638653935646431343630653665326163227d",
    status: TransactionStatusEnum.Pending,
  },
};

export const VALID_COMPILED_CONTRACT_MODEL: CompiledSmartContractModel = {
  compiled_smart_contract_id: "test-compiled-contract-1",
  solidity_input_json: "{}",
  contract_creation_bytecode: "0x",
  abi: JSON.stringify("some-abi"),
  contract_name: "TestContract",
};

export const VALID_SMART_CONTRACT_CUSTOM_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-custom",
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: walletId,
  contract_name: "TestContract",
  is_external: false,
  contract_address: "0xcontract-address",
  type: SmartContractType.Custom,
  abi: JSON.stringify("some-abi"),
  transaction: {
    network_id: Coinbase.networks.BaseSepolia,
    from_address_id: "0xdeadbeef",
    unsigned_payload:
      "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e6365223a22307830222c22746f223a22307861383261623835303466646562326461646161336234663037356539363762626533353036356239222c22676173223a22307865623338222c226761735072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a2230786634323430222c226d6178466565506572476173223a2230786634333638222c2276616c7565223a22307830222c22696e707574223a223078366136323738343230303030303030303030303030303030303030303030303034373564343164653761383132393862613236333138343939363830306362636161643733633062222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c2279506172697479223a22307830222c2268617368223a22307865333131636632303063643237326639313566656433323165663065376431653965353362393761346166623737336638653935646431343630653665326163227d",
    status: TransactionStatusEnum.Pending,
  },
};

export const VALID_SMART_CONTRACT_EXTERNAL_MODEL: SmartContractModel = {
  smart_contract_id: "test-smart-contract-external",
  network_id: Coinbase.networks.BaseSepolia,
  contract_name: ERC20_NAME,
  is_external: true,
  contract_address: "0xcontract-address",
  type: SmartContractType.Custom,
  abi: JSON.stringify("some-abi"),
};

const asset = Asset.fromModel({
  asset_id: Coinbase.assets.Eth,
  network_id: "base-sepolia",
  contract_address: "0x",
  decimals: 18,
});

export const VALID_USDC_CRYPTO_AMOUNT_MODEL: CryptoAmountModel = {
  amount: "1",
  asset: {
    network_id: "base-sepolia",
    asset_id: Coinbase.assets.Usdc,
    contract_address: "0x",
    decimals: 6,
  },
};

export const VALID_ETH_CRYPTO_AMOUNT_MODEL: CryptoAmountModel = {
  amount: "1",
  asset: {
    network_id: "base-sepolia",
    asset_id: Coinbase.assets.Eth,
    contract_address: "0x",
    decimals: 18,
  },
};

export const VALID_ASSET_MODEL: AssetModel = {
  asset_id: Coinbase.assets.Eth,
  network_id: "base-sepolia",
  contract_address: "0x",
  decimals: 18,
};

export const VALID_FUND_QUOTE_MODEL: FundQuoteModel = {
  fund_quote_id: "test-quote-id",
  network_id: "base-sepolia",
  wallet_id: "test-wallet-id",
  address_id: "test-address-id",
  crypto_amount: VALID_ETH_CRYPTO_AMOUNT_MODEL,
  fiat_amount: {
    amount: "100",
    currency: "USD",
  },
  expires_at: "2024-12-31T23:59:59Z",
  fees: {
    buy_fee: {
      amount: "1",
      currency: "USD",
    },
    transfer_fee: {
      amount: "10000000000000000", // 0.01 ETH
      asset: {
        network_id: "base-sepolia",
        asset_id: Coinbase.assets.Eth,
        contract_address: "0x",
        decimals: 18,
      },
    },
  },
};

export const VALID_FUND_OPERATION_MODEL: FundOperationModel = {
  fund_operation_id: "test-operation-id",
  network_id: Coinbase.networks.BaseSepolia,
  wallet_id: "test-wallet-id",
  address_id: "test-address-id",
  crypto_amount: VALID_ETH_CRYPTO_AMOUNT_MODEL,
  fiat_amount: {
    amount: "100",
    currency: "USD",
  },
  fees: {
    buy_fee: {
      amount: "1",
      currency: "USD",
    },
    transfer_fee: {
      amount: "10000000000000000", // 0.01 ETH in wei
      asset: {
        asset_id: Coinbase.assets.Eth,
        network_id: Coinbase.networks.BaseSepolia,
        decimals: 18,
        contract_address: "0x",
      },
    },
  },
  status: "complete" as const,
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
    network_id: Coinbase.networks.EthereumHoodi,
    address_id: "some-address-id",
    status: status,
    transactions: [
      {
        network_id: Coinbase.networks.EthereumHoodi,
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
  status: ValidatorStatus,
  public_key: string,
): Validator {
  return {
    validator_id: public_key,
    network_id: "ethereum-hoodi",
    asset_id: "eth",
    status: status,
    details: {
      index: index,
      public_key: public_key,
      withdrawal_address: "0xwithdrawal_address_1",
      withdrawal_credentials: "0x01withdrawal_credentials_1",
      fee_recipient_address: "0xfee_recipient_address_1",
      forwarded_fee_recipient_address: "0xforwarded_fee_recipient_address_1",
      slashed: false,
      activationEpoch: "10",
      exitEpoch: "10",
      withdrawableEpoch: "10",
      balance: {
        amount: "32000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.EthereumHoodi,
        },
      },
      effective_balance: {
        amount: "32000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.EthereumHoodi,
        },
      },
    },
  };
}

export const VALID_ACTIVE_VALIDATOR_LIST: ValidatorList = {
  data: [
    mockEthereumValidator("100", ValidatorStatus.Active, "0xpublic_key_1"),
    mockEthereumValidator("200", ValidatorStatus.Active, "0xpublic_key_2"),
    mockEthereumValidator("300", ValidatorStatus.Active, "0xpublic_key_3"),
  ],
  has_more: false,
  next_page: "",
};

export const VALID_EXITING_VALIDATOR_LIST: ValidatorList = {
  data: [
    mockEthereumValidator("400", ValidatorStatus.Exiting, "0xpublic_key_4"),
    mockEthereumValidator("500", ValidatorStatus.Exiting, "0xpublic_key_5"),
    mockEthereumValidator("600", ValidatorStatus.Exiting, "0xpublic_key_6"),
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
  createPayloadSignature: jest.fn(),
  getPayloadSignature: jest.fn(),
  listPayloadSignatures: jest.fn(),
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

export const stakeApiMock = {
  buildStakingOperation: jest.fn(),
  getExternalStakingOperation: jest.fn(),
  getStakingContext: jest.fn(),
  fetchStakingRewards: jest.fn(),
  fetchHistoricalStakingBalances: jest.fn(),
  getValidator: jest.fn(),
  listValidators: jest.fn(),
};

export const walletStakeApiMock = {
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
  listAddressTransactions: jest.fn(),
  getFaucetTransaction: jest.fn(),
  broadcastExternalTransaction: jest.fn(),
};

export const balanceHistoryApiMock = {
  listAddressHistoricalBalance: jest.fn(),
};

export const transactionHistoryApiMock = {
  listAddressTransactions: jest.fn(),
};

export const serverSignersApiMock = {
  listServerSigners: jest.fn(),
};

export const contractEventApiMock = {
  listContractEvents: jest.fn(),
};

export const smartContractApiMock = {
  compileSmartContract: jest.fn(),
  createSmartContract: jest.fn(),
  deploySmartContract: jest.fn(),
  getSmartContract: jest.fn(),
  listSmartContracts: jest.fn(),
  readContract: jest.fn(),
  registerSmartContract: jest.fn(),
  updateSmartContract: jest.fn(),
};

export const contractInvocationApiMock = {
  getContractInvocation: jest.fn(),
  listContractInvocations: jest.fn(),
  createContractInvocation: jest.fn(),
  broadcastContractInvocation: jest.fn(),
};

export const assetApiMock = {
  getAsset: jest.fn(),
};

export const fundOperationsApiMock = {
  getFundOperation: jest.fn(),
  listFundOperations: jest.fn(),
  createFundOperation: jest.fn(),
  createFundQuote: jest.fn(),
};

export const reputationApiMock = {
  getAddressReputation: jest.fn(),
};

export const smartWalletApiMock = {
  createSmartWallet: jest.fn(),
  getSmartWallet: jest.fn(),
  createUserOperation: jest.fn(),
  broadcastUserOperation: jest.fn(),
  getUserOperation: jest.fn(),
};

export const testAllReadTypesABI = [
  {
    type: "function",
    name: "exampleFunction",
    inputs: [
      {
        name: "z",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureAddress",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureArray",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBool",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes1",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes1",
        internalType: "bytes1",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes10",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes10",
        internalType: "bytes10",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes11",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes11",
        internalType: "bytes11",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes12",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes12",
        internalType: "bytes12",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes13",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes13",
        internalType: "bytes13",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes14",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes14",
        internalType: "bytes14",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes15",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes15",
        internalType: "bytes15",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes16",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes16",
        internalType: "bytes16",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes17",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes17",
        internalType: "bytes17",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes18",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes18",
        internalType: "bytes18",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes19",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes19",
        internalType: "bytes19",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes2",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes2",
        internalType: "bytes2",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes20",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes20",
        internalType: "bytes20",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes21",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes21",
        internalType: "bytes21",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes22",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes22",
        internalType: "bytes22",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes23",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes23",
        internalType: "bytes23",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes24",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes24",
        internalType: "bytes24",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes25",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes25",
        internalType: "bytes25",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes26",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes26",
        internalType: "bytes26",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes27",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes27",
        internalType: "bytes27",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes28",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes28",
        internalType: "bytes28",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes29",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes29",
        internalType: "bytes29",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes3",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes3",
        internalType: "bytes3",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes30",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes30",
        internalType: "bytes30",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes31",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes31",
        internalType: "bytes31",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes32",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes4",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes5",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes5",
        internalType: "bytes5",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes6",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes6",
        internalType: "bytes6",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes7",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes7",
        internalType: "bytes7",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes8",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes8",
        internalType: "bytes8",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytes9",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes9",
        internalType: "bytes9",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureBytesShort",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureFunctionSelector",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt128",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int128",
        internalType: "int128",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt16",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int16",
        internalType: "int16",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt256",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int256",
        internalType: "int256",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt32",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int32",
        internalType: "int32",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt64",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int64",
        internalType: "int64",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureInt8",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "int8",
        internalType: "int8",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureNestedStruct",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct TestAllReadTypes.ExampleStruct",
        components: [
          {
            name: "a",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "nestedFields",
            type: "tuple",
            internalType: "struct TestAllReadTypes.NestedData",
            components: [
              {
                name: "nestedArray",
                type: "tuple",
                internalType: "struct TestAllReadTypes.ArrayData",
                components: [
                  {
                    name: "a",
                    type: "uint256[]",
                    internalType: "uint256[]",
                  },
                ],
              },
              {
                name: "a",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
        ],
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureString",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureTuple",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureTupleMixedTypes",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint128",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint128",
        internalType: "uint128",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint16",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint256",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint32",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint32",
        internalType: "uint32",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint64",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "pureUint8",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "returnFunction",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "function",
        internalType: "function (uint256) external returns (bool)",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "viewUint",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "x",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
] as const;

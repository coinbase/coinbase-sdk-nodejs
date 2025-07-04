/* eslint-disable @typescript-eslint/no-explicit-any */
import * as crypto from "crypto";
import { randomUUID } from "crypto";
import { AxiosError } from "axios";
import { ethers } from "ethers";
import { FaucetTransaction } from "../coinbase/faucet_transaction";
import {
  Address as AddressModel,
  Balance as BalanceModel,
  FetchHistoricalStakingBalances200Response,
  FetchStakingRewards200Response,
  SmartContractType,
  StakingContext as StakingContextModel,
  StakingOperation as StakingOperationModel,
  StakingOperationStatusEnum,
  StakingRewardFormat,
  StakingRewardStateEnum,
  Trade as TradeModel,
  TransferList,
} from "../client";
import Decimal from "decimal.js";
import { APIError, FaucetLimitReachedError } from "../coinbase/api_error";
import { Coinbase } from "../coinbase/coinbase";
import { ArgumentError } from "../coinbase/errors";
import {
  addressesApiMock,
  assetsApiMock,
  contractInvocationApiMock,
  ERC1155_URI,
  ERC20_NAME,
  ERC20_SYMBOL,
  ERC20_TOTAL_SUPPLY,
  ERC721_BASE_URI,
  ERC721_NAME,
  ERC721_SYMBOL,
  externalAddressApiMock,
  generateRandomHash,
  getAssetMock,
  MINT_NFT_ABI,
  MINT_NFT_ARGS,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  smartContractApiMock,
  stakeApiMock,
  tradeApiMock,
  transfersApiMock,
  VALID_ADDRESS_BALANCE_LIST,
  VALID_ADDRESS_MODEL,
  VALID_COMPILED_CONTRACT_MODEL,
  VALID_CONTRACT_INVOCATION_MODEL,
  VALID_FAUCET_TRANSACTION_MODEL,
  VALID_PAYLOAD_SIGNATURE_LIST,
  VALID_PAYLOAD_SIGNATURE_MODEL,
  VALID_SIGNED_CONTRACT_INVOCATION_MODEL,
  VALID_SMART_CONTRACT_CUSTOM_MODEL,
  VALID_SMART_CONTRACT_ERC1155_MODEL,
  VALID_SMART_CONTRACT_ERC20_MODEL,
  VALID_SMART_CONTRACT_ERC721_MODEL,
  VALID_TRANSFER_MODEL,
  VALID_WALLET_MODEL,
  walletsApiMock,
  walletStakeApiMock,
} from "./utils";
import { Transfer } from "../coinbase/transfer";
import { StakeOptionsMode, TransactionStatus } from "../coinbase/types";
import { Trade } from "../coinbase/trade";
import { Transaction } from "../coinbase/transaction";
import { WalletAddress } from "../coinbase/address/wallet_address";
import { Wallet } from "../coinbase/wallet";
import {
  ConsensusLayerExitOptionBuilder,
  ExecutionLayerWithdrawalOptionsBuilder,
  StakingOperation,
} from "../coinbase/staking_operation";
import { StakingReward } from "../coinbase/staking_reward";
import { StakingBalance } from "../coinbase/staking_balance";
import { PayloadSignature } from "../coinbase/payload_signature";
import { ContractInvocation } from "../coinbase/contract_invocation";
import { SmartContract } from "../coinbase/smart_contract";

// Test suite for the WalletAddress class
describe("WalletAddress", () => {
  const transactionHash = generateRandomHash();
  let address: WalletAddress;
  let balanceModel: BalanceModel;
  let key;

  beforeEach(() => {
    Coinbase.apiClients.externalAddress = externalAddressApiMock;
    Coinbase.apiClients.asset = assetsApiMock;
    Coinbase.apiClients.asset.getAsset = getAssetMock();
    Coinbase.apiClients.externalAddress.getExternalAddressBalance = mockFn(request => {
      const [, , asset_id] = request;
      balanceModel = {
        amount: "1000000000000000000",
        asset: {
          asset_id,
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
          contract_address: "0x",
        },
      };
      return { data: balanceModel };
    });
    Coinbase.apiClients.externalAddress.listExternalAddressBalances = mockFn(() => {
      return { data: VALID_ADDRESS_BALANCE_LIST };
    });
  });

  beforeEach(() => {
    key = ethers.Wallet.createRandom();
    address = new WalletAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);

    jest.clearAllMocks();
  });

  it("should initialize a new WalletAddress", () => {
    expect(address).toBeInstanceOf(WalletAddress);
  });

  it("should initialize a new WalletAddress that can sign", () => {
    expect(address).toBeInstanceOf(WalletAddress);
    expect(address.canSign()).toEqual(true);
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
    expect(Coinbase.apiClients.externalAddress!.listExternalAddressBalances).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
    );
    expect(Coinbase.apiClients.externalAddress!.listExternalAddressBalances).toHaveBeenCalledTimes(
      1,
    );
  });

  it("should return the correct ETH balance", async () => {
    const ethBalance = await address.getBalance(Coinbase.assets.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(1));
    expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return 0 balance when the response is empty", async () => {
    Coinbase.apiClients.externalAddress!.getExternalAddressBalance = mockReturnValue(null);
    const ethBalance = await address.getBalance(Coinbase.assets.Eth);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal(0));
  });

  it("should return the correct Gwei balance", async () => {
    const assetId = "gwei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000"));
    expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the correct Wei balance", async () => {
    const assetId = "wei";
    const ethBalance = await address.getBalance(assetId);
    expect(ethBalance).toBeInstanceOf(Decimal);
    expect(ethBalance).toEqual(new Decimal("1000000000000000000"));
    expect(Coinbase.apiClients.externalAddress?.getExternalAddressBalance).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
      Coinbase.assets.Eth,
    );
    expect(Coinbase.apiClients.externalAddress?.getExternalAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return an error for an unsupported asset", async () => {
    const getAddressBalance = mockReturnRejectedValue(new APIError(""));
    const assetId = "unsupported-asset";
    Coinbase.apiClients.externalAddress!.getExternalAddressBalance = getAddressBalance;
    await expect(address.getBalance(assetId)).rejects.toThrow(APIError);
    expect(getAddressBalance).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
      assetId,
    );
    expect(getAddressBalance).toHaveBeenCalledTimes(1);
  });

  it("should return the wallet ID", () => {
    expect(address.getWalletId()).toBe(VALID_ADDRESS_MODEL.wallet_id);
  });

  it("should throw an Error when model is not provided", () => {
    expect(() => new WalletAddress(null!, key as unknown as ethers.Wallet)).toThrow(
      `Address model cannot be empty`,
    );
  });

  describe("#faucet", () => {
    let faucetTransaction: FaucetTransaction;

    beforeEach(() => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnValue(
        VALID_FAUCET_TRANSACTION_MODEL,
      );
    });

    it("returns the faucet transaction", async () => {
      const faucetTransaction = await address.faucet();

      expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);

      expect(faucetTransaction.getTransactionHash()).toBe(
        VALID_FAUCET_TRANSACTION_MODEL.transaction!.transaction_hash,
      );

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        undefined,
        true, // Skip wait should be true.
      );

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
        1,
      );
    });

    it("returns the faucet transaction when specifying the asset ID", async () => {
      const faucetTransaction = await address.faucet("usdc");

      expect(faucetTransaction.getTransactionHash()).toBe(
        VALID_FAUCET_TRANSACTION_MODEL.transaction!.transaction_hash,
      );

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        "usdc",
        true, // Skip wait should be true.
      );

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should throw an APIError when the request is unsuccessful", async () => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnRejectedValue(
        new APIError(""),
      );

      await expect(address.faucet()).rejects.toThrow(APIError);

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        undefined,
        true, // Skip wait should be true.
      );

      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should throw a FaucetLimitReachedError when the faucet limit is reached", async () => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnRejectedValue(
        new FaucetLimitReachedError(""),
      );
      await expect(address.faucet()).rejects.toThrow(FaucetLimitReachedError);
      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should throw an Error when the request fails unexpectedly", async () => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnRejectedValue(
        new Error(""),
      );
      await expect(address.faucet()).rejects.toThrow(Error);
      expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `WalletAddress{ addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}' }`,
    );
  });

  describe("#setKey", () => {
    it("should set the key successfully", () => {
      key = ethers.Wallet.createRandom();
      const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, undefined);
      expect(() => {
        newAddress.setKey(key);
      }).not.toThrow(Error);
    });
    it("should not set the key successfully", () => {
      key = ethers.Wallet.createRandom();
      const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, key);
      expect(() => {
        newAddress.setKey(key);
      }).toThrow(Error);
    });
  });

  describe("#export", () => {
    it("should get the private key if it is set", () => {
      key = ethers.Wallet.createRandom();
      const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, key);
      expect(newAddress.export()).toEqual(key.privateKey);
    });

    it("should not get the private key if not set", () => {
      const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, undefined);
      expect(() => {
        newAddress.export();
      }).toThrow(Error);
    });
  });

  describe("#stakingOperation", () => {
    key = ethers.Wallet.createRandom();
    const newAddress = newAddressModel("", randomUUID(), Coinbase.networks.EthereumHoodi);
    const walletAddress = new WalletAddress(newAddress, key as unknown as ethers.Wallet);
    const STAKING_OPERATION_MODEL: StakingOperationModel = {
      id: randomUUID(),
      network_id: Coinbase.networks.EthereumHoodi,
      address_id: newAddress.address_id,
      status: StakingOperationStatusEnum.Complete,
      transactions: [
        {
          from_address_id: newAddress.address_id,
          network_id: Coinbase.networks.EthereumHoodi,
          status: "pending",
          unsigned_payload:
            "7b2274797065223a22307832222c22636861696e4964223a22307834323638222c226e6f" +
            "6e6365223a2230783137222c22746f223a22307861353534313664653564653631613061" +
            "633161613839373061323830653034333838623164653462222c22676173223a22307833" +
            "30643430222c226761735072696365223a6e756c6c2c226d61785072696f726974794665" +
            "65506572476173223a223078323534306265343030222c226d6178466565506572476173" +
            "223a223078326437313162383430222c2276616c7565223a223078356166333130376134" +
            "303030222c22696e707574223a2230783361346236366631222c226163636573734c6973" +
            "74223a5b5d2c2276223a22307830222c2272223a22307830222c2273223a22307830222c" +
            "2279506172697479223a22307830222c2268617368223a22307839613034353830343332" +
            "646630666334656139646164653561343836353433623831666239333833316430646239" +
            "386263356436373834393339343866333432227d",
        },
      ],
    };

    const STAKING_CONTEXT_MODEL: StakingContextModel = {
      context: {
        stakeable_balance: {
          amount: "128000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHoodi,
            decimals: 18,
            contract_address: "0x",
          },
        },
        unstakeable_balance: {
          amount: "2000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHoodi,
            decimals: 18,
            contract_address: "0x",
          },
        },
        pending_claimable_balance: {
          amount: "1000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHoodi,
            decimals: 18,
            contract_address: "0x",
          },
        },
        claimable_balance: {
          amount: "1000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHoodi,
            decimals: 18,
            contract_address: "0x",
          },
        },
      },
    };

    const STAKING_REWARD_RESPONSE: FetchStakingRewards200Response = {
      data: [
        {
          address_id: newAddress.address_id,
          date: "2024-05-01",
          amount: "361",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Usd,
          usd_value: {
            amount: "361",
            conversion_price: "3000",
            conversion_time: "2024-05-01T00:00:00Z",
          },
        },
        {
          address_id: newAddress.address_id,
          date: "2024-05-02",
          amount: "203",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Usd,
          usd_value: {
            amount: "203",
            conversion_price: "3000",
            conversion_time: "2024-05-02T00:00:00Z",
          },
        },
        {
          address_id: newAddress.address_id,
          date: "2024-05-03",
          amount: "226",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Usd,
          usd_value: {
            amount: "226",
            conversion_price: "3000",
            conversion_time: "2024-05-03T00:00:00Z",
          },
        },
      ],
      has_more: false,
      next_page: "",
    };

    const HISTORICAL_STAKING_BALANCES_RESPONSE: FetchHistoricalStakingBalances200Response = {
      data: [
        {
          address: newAddress.address_id,
          date: "2024-05-01",
          bonded_stake: {
            amount: "32000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 18,
            },
          },
          unbonded_balance: {
            amount: "2000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 18,
            },
          },
          participant_type: "validator",
        },
        {
          address: newAddress.address_id,
          date: "2024-05-02",
          bonded_stake: {
            amount: "34000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 18,
            },
          },
          unbonded_balance: {
            amount: "3000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHoodi,
              decimals: 18,
            },
          },
          participant_type: "validator",
        },
      ],
      has_more: false,
      next_page: "",
    };

    beforeAll(() => {
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.stake = stakeApiMock;
      Coinbase.apiClients.walletStake = walletStakeApiMock;
      Coinbase.apiClients.asset = assetsApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      STAKING_OPERATION_MODEL.wallet_id = newAddress.wallet_id;
    });

    describe("#createStake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });

      describe("native eth staking", () => {
        it("should successfully create an 0x01 stake operation", async () => {
          Coinbase.apiClients.asset!.getAsset = getAssetMock();
          Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
          Coinbase.apiClients.walletStake!.createStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          Coinbase.apiClients.walletStake!.broadcastStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
          Coinbase.apiClients.walletStake!.getStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);

          const op = await walletAddress.createStake(
            32,
            Coinbase.assets.Eth,
            StakeOptionsMode.NATIVE,
            {
              withdrawal_credential_type: "0x01",
            },
          );

          expect(Coinbase.apiClients.walletStake!.createStakingOperation).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              network_id: walletAddress.getNetworkId(),
              asset_id: Coinbase.assets.Eth,
              action: "stake",
              options: {
                mode: StakeOptionsMode.NATIVE,
                amount: "32000000000000000000",
                withdrawal_credential_type: "0x01",
              },
            },
          );
          expect(op).toBeInstanceOf(StakingOperation);
        });

        it("should successfully create an 0x02 stake operation", async () => {
          Coinbase.apiClients.asset!.getAsset = getAssetMock();
          Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
          Coinbase.apiClients.walletStake!.createStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          Coinbase.apiClients.walletStake!.broadcastStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
          Coinbase.apiClients.walletStake!.getStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);

          const op = await walletAddress.createStake(
            64,
            Coinbase.assets.Eth,
            StakeOptionsMode.NATIVE,
            {
              withdrawal_credential_type: "0x02",
            },
          );

          expect(Coinbase.apiClients.walletStake!.createStakingOperation).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              network_id: walletAddress.getNetworkId(),
              asset_id: Coinbase.assets.Eth,
              action: "stake",
              options: {
                mode: StakeOptionsMode.NATIVE,
                amount: "64000000000000000000",
                withdrawal_credential_type: "0x02",
              },
            },
          );
          expect(op).toBeInstanceOf(StakingOperation);
        });

        it("should create a staking operation from the address but in failed status", async () => {
          Coinbase.apiClients.asset!.getAsset = getAssetMock();
          Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
          Coinbase.apiClients.walletStake!.createStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          Coinbase.apiClients.walletStake!.broadcastStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Failed;
          Coinbase.apiClients.walletStake!.getStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);

          const op = await walletAddress.createStake(0.001, Coinbase.assets.Eth);

          expect(op).toBeInstanceOf(StakingOperation);
          expect(op.getStatus()).toEqual(StakingOperationStatusEnum.Failed);
        });
      });

      it("should create a staking operation from the address when broadcast returns empty transactions", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        STAKING_OPERATION_MODEL.transactions = [];
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe("#createUnstake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createUnstake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });

      describe("with native eth consensus layer exits", () => {
        it("should create a staking operation from the address", async () => {
          Coinbase.apiClients.asset!.getAsset = getAssetMock();
          Coinbase.apiClients.walletStake!.createStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          Coinbase.apiClients.walletStake!.broadcastStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
          Coinbase.apiClients.walletStake!.getStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);

          const builder = new ConsensusLayerExitOptionBuilder();
          builder.addValidator("0x123");
          builder.addValidator("0x456");
          builder.addValidator("0x456");
          builder.addValidator("0x789");
          builder.addValidator("0x789");
          const options = await builder.build();

          const op = await walletAddress.createUnstake(
            0.001,
            Coinbase.assets.Eth,
            StakeOptionsMode.NATIVE,
            options,
          );

          expect(Coinbase.apiClients.walletStake!.createStakingOperation).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              network_id: walletAddress.getNetworkId(),
              asset_id: Coinbase.assets.Eth,
              action: "unstake",
              options: {
                mode: StakeOptionsMode.NATIVE,
                amount: "1000000000000000", // We let this extraneous amount to be passed through since it isn't used in the backend.
                unstake_type: "consensus",
                validator_pub_keys: "0x123,0x456,0x789",
              },
            },
          );
          expect(op).toBeInstanceOf(StakingOperation);
        });
      });

      describe("with native eth execution layer withdrawals", () => {
        it("should create a staking operation from the address", async () => {
          Coinbase.apiClients.asset!.getAsset = getAssetMock();
          Coinbase.apiClients.walletStake!.createStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          Coinbase.apiClients.walletStake!.broadcastStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);
          STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
          Coinbase.apiClients.walletStake!.getStakingOperation =
            mockReturnValue(STAKING_OPERATION_MODEL);

          const builder = new ExecutionLayerWithdrawalOptionsBuilder(walletAddress.getNetworkId());
          builder.addValidatorWithdrawal("0x123", 100);
          builder.addValidatorWithdrawal("0x456", 200);
          const options = await builder.build();

          const op = await walletAddress.createUnstake(
            0.001,
            Coinbase.assets.Eth,
            StakeOptionsMode.NATIVE,
            options,
          );

          expect(Coinbase.apiClients.walletStake!.createStakingOperation).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              network_id: walletAddress.getNetworkId(),
              asset_id: Coinbase.assets.Eth,
              action: "unstake",
              options: {
                mode: StakeOptionsMode.NATIVE,
                unstake_type: "execution",
                amount: "1000000000000000", // We let this extraneous amount to be passed through since it isn't used in the backend.
                validator_unstake_amounts:
                  '{"0x123":"100000000000000000000","0x456":"200000000000000000000"}',
              },
            },
          );
          expect(op).toBeInstanceOf(StakingOperation);
        });
      });
    });

    describe("#createClaimStake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createClaimStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe("#createValidatorConsolidation", () => {
      it("should successfully create a validator consolidation operation", async () => {
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createValidatorConsolidation({
          source_validator_pubkey: "0xabc123",
          target_validator_pubkey: "0xdef456",
        });

        expect(Coinbase.apiClients.walletStake!.createStakingOperation).toHaveBeenCalledWith(
          walletAddress.getWalletId(),
          walletAddress.getId(),
          {
            network_id: walletAddress.getNetworkId(),
            asset_id: "eth",
            action: "consolidate",
            options: {
              mode: "native",
              amount: "0",
              source_validator_pubkey: "0xabc123",
              target_validator_pubkey: "0xdef456",
            },
          },
        );

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe("#stakeableBalance", () => {
      it("should return the stakeable balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.stakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("128"));
      });
    });

    describe("#unstakeableBalance", () => {
      it("should return the unstakeableBalance balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.unstakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("2"));
      });
    });

    describe("#claimableBalance", () => {
      it("should return the claimableBalance balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.claimableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("1"));
      });
    });

    describe("#stakingRewards", () => {
      it("should successfully return staking rewards", async () => {
        Coinbase.apiClients.stake!.fetchStakingRewards = mockReturnValue(STAKING_REWARD_RESPONSE);
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        const response = await walletAddress.stakingRewards(Coinbase.assets.Eth);
        expect(response).toBeInstanceOf(Array<StakingReward>);
      });
    });

    describe("#historicalStakingBalances", () => {
      it("should successfully return historical staking balances", async () => {
        Coinbase.apiClients.stake!.fetchHistoricalStakingBalances = mockReturnValue(
          HISTORICAL_STAKING_BALANCES_RESPONSE,
        );
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        const response = await walletAddress.historicalStakingBalances(Coinbase.assets.Eth);
        expect(response).toBeInstanceOf(Array<StakingBalance>);
        expect(response.length).toEqual(2);
        expect(response[0].bondedStake().amount).toEqual(new Decimal("32"));
        expect(response[0].bondedStake().asset?.assetId).toEqual(Coinbase.assets.Eth);
        expect(response[0].bondedStake().asset?.decimals).toEqual(18);
        expect(response[0].bondedStake().asset?.networkId).toEqual(Coinbase.networks.EthereumHoodi);
        expect(response[0].unbondedBalance().amount).toEqual(new Decimal("2"));
        expect(response[0].unbondedBalance().asset?.assetId).toEqual(Coinbase.assets.Eth);
        expect(response[0].unbondedBalance().asset?.decimals).toEqual(18);
        expect(response[0].unbondedBalance().asset?.networkId).toEqual(
          Coinbase.networks.EthereumHoodi,
        );
      });
    });
  });

  describe("#createTransfer", () => {
    let weiAmount, destination;
    let walletId, id;

    beforeEach(() => {
      weiAmount = new Decimal("500000000000000000");
      destination = new WalletAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);
      walletId = crypto.randomUUID();
      id = crypto.randomUUID();
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.asset = assetsApiMock;
      Coinbase.apiClients.asset.getAsset = getAssetMock();
      Coinbase.apiClients.externalAddress.getExternalAddressBalance = mockFn((...request) => {
        const [, , asset_id] = request;
        balanceModel = {
          amount: "1000000000000000000",
          asset: {
            asset_id,
            network_id: Coinbase.networks.BaseSepolia,
            decimals: 18,
            contract_address: "0x",
          },
        };
        return { data: balanceModel };
      });

      Coinbase.apiClients.transfer = transfersApiMock;
      Coinbase.useServerSigner = false;
    });

    it("should successfully create the transfer", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });

      const transfer = await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);

      expect(transfer).toBeInstanceOf(Transfer);
      expect(transfer.getId()).toBe(VALID_TRANSFER_MODEL.transfer_id);
    });

    it("should default skipBatching to false", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });

      await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        expect.objectContaining({
          skip_batching: false,
        }),
      );
    });

    it("should allow skipBatching to be set to true", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });

      await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
        gasless: true,
        skipBatching: true,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        expect.objectContaining({
          skip_batching: true,
        }),
      );
    });

    it("should throw an ArgumentError if skipBatching is true but gasless is false", async () => {
      await expect(
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
          skipBatching: true,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully construct createTransfer request when using a large number that causes scientific notation", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });
      Coinbase.apiClients.externalAddress!.getExternalAddressBalance = mockFn(request => {
        const [, , asset_id] = request;
        balanceModel = {
          amount: "10000000000000000000000",
          asset: {
            asset_id,
            network_id: Coinbase.networks.BaseSepolia,
            decimals: 18,
            contract_address: "0x",
          },
        };
        return { data: balanceModel };
      });

      // construct amount of 1000 with 18 decimal places which is large enough to cause scientific notation
      const transfer = await address.createTransfer({
        amount: new Decimal("1000000000000000000000"),
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        {
          amount: "1000000000000000000000",
          asset_id: Coinbase.assets.Eth,
          destination: destination.getId(),
          gasless: false,
          network_id: Coinbase.networks.BaseSepolia,
          skip_batching: false,
        },
      );

      expect(transfer).toBeInstanceOf(Transfer);
      expect(transfer.getId()).toBe(VALID_TRANSFER_MODEL.transfer_id);
    });

    it("should throw an APIError if the createTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnRejectedValue(
        new APIError("Failed to create transfer"),
      );
      await expect(
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(APIError);
    });

    it("should throw an Error if the address key is not provided", async () => {
      const addressWithoutKey = new WalletAddress(VALID_ADDRESS_MODEL, null!);
      await expect(
        addressWithoutKey.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(Error);
    });

    it("should throw an ArgumentError if the Wallet Network ID does not match the Address Network ID", async () => {
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address.createAddress = mockReturnValue(
        newAddressModel(walletId, id, Coinbase.networks.BaseMainnet),
      );
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
      });
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
      });
      const invalidDestination = await Wallet.create({
        networkId: Coinbase.networks.BaseMainnet,
      });
      await expect(
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination: invalidDestination,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should throw an ArgumentError if the Address Network ID does not match the Wallet Network ID", async () => {
      const invalidDestination = new WalletAddress(
        newAddressModel("invalidDestination", "", Coinbase.networks.BaseMainnet),
        null!,
      );
      await expect(
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination: invalidDestination,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should throw an APIError if the broadcastTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      await expect(
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(APIError);
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        address.createTransfer({
          amount: insufficientAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);

      await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe("#listTransfers", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const pages = ["abc", "def"];
      const response = {
        data: [VALID_TRANSFER_MODEL],
        has_more: false,
        next_page: "",
        total_count: 0,
      } as TransferList;
      Coinbase.apiClients.transfer!.listTransfers = mockReturnValue(response);
    });

    it("should return the list of transfers", async () => {
      const paginationResponse = await address.listTransfers();
      const transfers = paginationResponse.data;
      expect(transfers).toHaveLength(1);
      expect(transfers[0]).toBeInstanceOf(Transfer);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledWith(
        address.getWalletId(),
        address.getId(),
        100,
        undefined,
      );
    });

    it("should raise an APIError when the API call fails", async () => {
      jest.clearAllMocks();
      Coinbase.apiClients.transfer!.listTransfers = mockReturnRejectedValue(new APIError(""));
      await expect(address.listTransfers()).rejects.toThrow(APIError);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(1);
    });
  });

  describe("#createTrade", () => {
    let addressId;
    let toAddressId;
    let ethBalanceResponse;
    let usdcBalanceResponse;
    let tradeId;
    let transactionHash;
    let unsignedPayload;
    let signedPayload;
    let broadcastTradeRequest;
    let transaction;
    let approveTransaction;
    let createdTrade;
    let transactionModel;
    let tradeModel;
    let broadcastedTransactionModel;
    let broadcastedTradeModel;
    let broadcastedTrade;
    let fromAssetId;
    let normalizedFromAssetId;
    let toAssetId;
    let balanceResponse;
    let destination;
    let amount;
    let useServerSigner;

    beforeEach(() => {
      addressId = "address_id";
      ethBalanceResponse = {
        amount: "1000000000000000000",
        asset: {
          asset_id: "eth",
          decimals: 18,
          network_id: Coinbase.networks.BaseSepolia,
          contract_address: "0x",
        },
      };
      usdcBalanceResponse = {
        amount: "10000000000",
        asset: {
          asset_id: "usdc",
          decimals: 6,
          network_id: Coinbase.networks.BaseSepolia,
          contract_address: "0x",
        },
      };
      tradeId = crypto.randomUUID();
      transactionHash = "0xdeadbeef";
      unsignedPayload =
        "7b2274797065223a22307832222c22636861696e4964223a2230783134613334222c226e6f6e63" +
        "65223a22307830222c22746f223a22307834643965346633663464316138623566346637623166" +
        "356235633762386436623262336231623062222c22676173223a22307835323038222c22676173" +
        "5072696365223a6e756c6c2c226d61785072696f72697479466565506572476173223a223078" +
        "3539363832663030222c226d6178466565506572476173223a2230783539363832663030222c22" +
        "76616c7565223a2230783536626337356532643633313030303030222c22696e707574223a22" +
        "3078222c226163636573734c697374223a5b5d2c2276223a22307830222c2272223a2230783022" +
        "2c2273223a22307830222c2279506172697479223a22307830222c2268617368223a2230783664" +
        "633334306534643663323633653363396561396135656438646561346332383966613861363966" +
        "3031653635393462333732386230386138323335333433227d";
      signedPayload =
        "02f87683014a34808459682f008459682f00825208944d9e4f3f4d1a8b5f4f7b1f5b5c7b8d6b2b3b1b0b89056bc75e2d6310000080c001a07ae1f4655628ac1b226d60a6243aed786a2d36241ffc0f306159674755f4bd9ca050cd207fdfa6944e2b165775e2ca625b474d1eb40fda0f03f4ca9e286eae3cbe";
      broadcastTradeRequest = { signed_payload: signedPayload };
      transaction = { sign: jest.fn().mockReturnValue(signedPayload) } as unknown as Transaction;
      approveTransaction = null;
      createdTrade = {
        id: tradeId,
        transaction: transaction,
        approve_transaction: approveTransaction,
      } as unknown as Trade;
      transactionModel = {
        trade_id: tradeId,
        status: "pending",
        unsigned_payload: unsignedPayload,
      } as unknown as TradeModel;
      tradeModel = {
        trade_id: tradeId,
        transaction: transactionModel,
        address_id: addressId,
      } as unknown as TradeModel;
      broadcastedTransactionModel = {
        trade_id: tradeId,
        status: "broadcast",
        unsigned_payload: unsignedPayload,
        signed_payload: signedPayload,
      } as unknown as TradeModel;
      broadcastedTradeModel = {
        id: tradeId,
        transaction: broadcastedTransactionModel,
        address_id: addressId,
      } as unknown as TradeModel;
      broadcastedTrade = {
        transaction: transaction,
        id: tradeId,
      } as unknown as Trade;
      fromAssetId = "eth";
      normalizedFromAssetId = "eth";
      toAssetId = "usdc";
      balanceResponse = ethBalanceResponse;
      destination = toAddressId;
      amount = new Decimal(0.5);
      Coinbase.useServerSigner = false;
    });

    describe("when the trade is successful", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        Coinbase.apiClients.asset = assetsApiMock;
        Coinbase.apiClients.trade = tradeApiMock;
        Coinbase.apiClients.address = addressesApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(balanceResponse);
        Coinbase.apiClients.asset.getAsset = getAssetMock();
        Coinbase.apiClients.trade!.createTrade = mockReturnValue(tradeModel);
        Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);

        jest.spyOn(key, "signTransaction").mockReturnValue(signedPayload);
      });

      it("should return the broadcasted trade", async () => {
        const result = await address.createTrade({
          amount: amount,
          fromAssetId: fromAssetId,
          toAssetId: toAssetId,
        });
        const transaction = result.getTransaction();
        expect(transaction.getSignedPayload()).toEqual(signedPayload);
        expect(transaction.getStatus()).toEqual(TransactionStatus.BROADCAST);
        expect(transaction.getUnsignedPayload()).toEqual(unsignedPayload);
        expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
          address.getWalletId(),
          address.getId(),
          {
            amount: `500000000000000000`,
            from_asset_id: normalizedFromAssetId,
            to_asset_id: toAssetId,
          },
        );
        expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledTimes(1);
      });

      describe("when the asset is Gwei", () => {
        beforeEach(() => {
          fromAssetId = "gwei";
          normalizedFromAssetId = "eth";
          amount = new Decimal(500000000);
        });

        it("should return the broadcasted trade", async () => {
          await address.createTrade({
            amount: amount,
            fromAssetId: fromAssetId,
            toAssetId: toAssetId,
          });
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `500000000000000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
          expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledTimes(1);
        });
      });

      describe("when the asset is ETH", () => {
        beforeEach(() => {
          fromAssetId = "eth";
          normalizedFromAssetId = "eth";
          amount = new Decimal(0.5);
        });

        it("should return the broadcasted trade", async () => {
          await address.createTrade({
            amount: amount,
            fromAssetId: fromAssetId,
            toAssetId: toAssetId,
          });
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `500000000000000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
          expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledTimes(1);
        });
      });

      describe("when the asset is USDC", () => {
        beforeEach(() => {
          fromAssetId = "usdc";
          normalizedFromAssetId = "usdc";
          amount = new Decimal(5);
          balanceResponse = { amount: "5000000", asset: { asset_id: "usdc", decimals: 6 } };
          Coinbase.apiClients.externalAddress!.getExternalAddressBalance =
            mockReturnValue(balanceResponse);
        });

        it("should return the broadcasted trade", async () => {
          await address.createTrade({
            amount: amount,
            fromAssetId: fromAssetId,
            toAssetId: toAssetId,
          });
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `5000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
          expect(Coinbase.apiClients.trade!.broadcastTrade).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe("when using server signer", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        Coinbase.apiClients.asset = assetsApiMock;
        Coinbase.apiClients.trade = tradeApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(balanceResponse);
        Coinbase.apiClients.trade!.createTrade = mockReturnValue(tradeModel);
        Coinbase.apiClients.asset.getAsset = getAssetMock();
        Coinbase.useServerSigner = true;
      });

      it("should successfully create a trade", async () => {
        const trade = await address.createTrade({
          amount: amount,
          fromAssetId: fromAssetId,
          toAssetId: toAssetId,
        });

        expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledTimes(1);

        expect(trade).toBeInstanceOf(Trade);
        expect(trade.getId()).toBe(tradeId);
      });
    });

    describe("when the address cannot sign", () => {
      it("should raise an Error", async () => {
        const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, null!);
        await expect(
          newAddress.createTrade({
            amount: new Decimal(100),
            fromAssetId: "eth",
            toAssetId: "usdc",
          }),
        ).rejects.toThrow(Error);
      });
    });

    describe("when the to fromAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(
          address.createTrade({ amount: new Decimal(100), fromAssetId: "XYZ", toAssetId: "eth" }),
        ).rejects.toThrow(Error);
      });
    });

    describe("when the to toAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(
          address.createTrade({ amount: new Decimal(100), fromAssetId: "eth", toAssetId: "XYZ" }),
        ).rejects.toThrow(Error);
      });
    });

    describe("when the balance is insufficient", () => {
      beforeAll(() => {
        Coinbase.apiClients.address = addressesApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue({ amount: "0" });
      });
      it("should raise an Error", async () => {
        await expect(
          address.createTrade({ amount: new Decimal(100), fromAssetId: "eth", toAssetId: "usdc" }),
        ).rejects.toThrow(Error);
      });
    });
  });

  describe("#invokeContract", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    const unsignedPayload = VALID_CONTRACT_INVOCATION_MODEL.transaction.unsigned_payload;
    let expectedSignedPayload: string;

    beforeAll(() => {
      Coinbase.apiClients.contractInvocation = contractInvocationApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();

      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
    });

    describe("when not using a server-signer", () => {
      beforeEach(async () => {
        Coinbase.useServerSigner = false;

        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);

        const tx = new Transaction(VALID_CONTRACT_INVOCATION_MODEL.transaction);
        expectedSignedPayload = await tx.sign(key as unknown as ethers.Wallet);
      });

      describe("when it is successful", () => {
        let contractInvocation;

        beforeEach(async () => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.contractInvocation!.broadcastContractInvocation = mockReturnValue({
            ...VALID_SIGNED_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          contractInvocation = await walletAddress.invokeContract({
            abi: MINT_NFT_ABI,
            args: MINT_NFT_ARGS,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
          });
        });

        it("returns a contract invocation", async () => {
          expect(contractInvocation).toBeInstanceOf(ContractInvocation);
          expect(contractInvocation.getId()).toBe(
            VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
          );
        });

        it("creates the contract invocation", async () => {
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledWith(walletAddress.getWalletId(), walletAddress.getId(), {
            abi: VALID_CONTRACT_INVOCATION_MODEL.abi,
            args: VALID_CONTRACT_INVOCATION_MODEL.args,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contract_address: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
          });
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the contract invocation", async () => {
          expect(
            Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
          ).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(
            Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is successful invoking a payable contract method", () => {
        let contractInvocation;
        const amount = new Decimal("1000");
        const balanceResponse = { amount: "5000000", asset: { asset_id: "eth", decimals: 18 } };

        beforeEach(async () => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
            amount,
          });

          Coinbase.apiClients.contractInvocation!.broadcastContractInvocation = mockReturnValue({
            ...VALID_SIGNED_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
            amount,
          });

          Coinbase.apiClients.externalAddress!.getExternalAddressBalance =
            mockReturnValue(balanceResponse);

          contractInvocation = await walletAddress.invokeContract({
            abi: MINT_NFT_ABI,
            args: MINT_NFT_ARGS,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            amount,
            assetId: Coinbase.assets.Wei,
          });
        });

        it("returns a contract invocation", async () => {
          expect(contractInvocation).toBeInstanceOf(ContractInvocation);
          expect(contractInvocation.getId()).toBe(
            VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
          );
          expect(contractInvocation.getAmount().toString()).toBe(amount.toString());
        });

        it("creates the contract invocation", async () => {
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledWith(walletAddress.getWalletId(), walletAddress.getId(), {
            abi: VALID_CONTRACT_INVOCATION_MODEL.abi,
            args: VALID_CONTRACT_INVOCATION_MODEL.args,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contract_address: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            amount: amount.toString(),
          });
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the contract invocation", async () => {
          expect(
            Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
          ).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(
            Coinbase.apiClients.contractInvocation!.broadcastContractInvocation,
          ).toHaveBeenCalledTimes(1);
        });

        it("checks for sufficient balance", async () => {
          expect(
            Coinbase.apiClients.externalAddress!.getExternalAddressBalance,
          ).toHaveBeenCalledWith(
            walletAddress.getNetworkId(),
            walletAddress.getId(),
            Coinbase.assets.Eth,
          );

          expect(
            Coinbase.apiClients.externalAddress!.getExternalAddressBalance,
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is fails to invoke a payable contract method", () => {
        const amount = new Decimal("1000");

        it("throws an error for invalid input", async () => {
          await expect(
            walletAddress.invokeContract({
              abi: MINT_NFT_ABI,
              args: MINT_NFT_ARGS,
              method: VALID_CONTRACT_INVOCATION_MODEL.method,
              contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
              amount,
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when no key is loaded", () => {
        beforeEach(() => {
          walletAddress = new WalletAddress(addressModel);
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.invokeContract({
              abi: MINT_NFT_ABI,
              args: MINT_NFT_ARGS,
              method: VALID_CONTRACT_INVOCATION_MODEL.method,
              contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when it fails to create a contract invocation", () => {
        beforeEach(() => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation =
            mockReturnRejectedValue(
              new APIError({
                response: {
                  status: 400,
                  data: {
                    code: "malformed_request",
                    message: "failed to create contract invocation: invalid abi",
                  },
                },
              } as AxiosError),
            );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.invokeContract({
              abi: { invalid_abi: "abi" },
              args: MINT_NFT_ARGS,
              method: VALID_CONTRACT_INVOCATION_MODEL.method,
              contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            }),
          ).rejects.toThrow(APIError);
        });
      });

      describe("when it fails to broadcast a contract invocation", () => {
        beforeEach(() => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.contractInvocation!.broadcastContractInvocation =
            mockReturnRejectedValue(
              new APIError({
                response: {
                  status: 400,
                  data: {
                    code: "invalid_signed_payload",
                    message: "failed to broadcast contract invocation: invalid signed payload",
                  },
                },
              } as AxiosError),
            );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.invokeContract({
              abi: MINT_NFT_ABI,
              args: MINT_NFT_ARGS,
              method: VALID_CONTRACT_INVOCATION_MODEL.method,
              contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });

    describe("when using a server-signer", () => {
      let contractInvocation;

      beforeEach(async () => {
        Coinbase.useServerSigner = true;

        walletAddress = new WalletAddress(addressModel);
      });

      describe("when it is successful", () => {
        beforeEach(async () => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          contractInvocation = await walletAddress.invokeContract({
            abi: MINT_NFT_ABI,
            args: MINT_NFT_ARGS,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
          });
        });

        it("returns a pending contract invocation", async () => {
          expect(contractInvocation).toBeInstanceOf(ContractInvocation);
          expect(contractInvocation.getId()).toBe(
            VALID_CONTRACT_INVOCATION_MODEL.contract_invocation_id,
          );
          expect(contractInvocation.getStatus()).toBe(TransactionStatus.PENDING);
        });

        it("creates a contract invocation", async () => {
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledWith(walletAddress.getWalletId(), walletAddress.getId(), {
            abi: VALID_CONTRACT_INVOCATION_MODEL.abi,
            args: VALID_CONTRACT_INVOCATION_MODEL.args,
            method: VALID_CONTRACT_INVOCATION_MODEL.method,
            contract_address: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
          });
          expect(
            Coinbase.apiClients.contractInvocation!.createContractInvocation,
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe("when creating a contract invocation fails", () => {
        beforeEach(() => {
          Coinbase.apiClients.contractInvocation!.createContractInvocation =
            mockReturnRejectedValue(
              new APIError({
                response: {
                  status: 400,
                  data: {
                    code: "malformed_request",
                    message: "failed to create contract invocation: invalid abi",
                  },
                },
              } as AxiosError),
            );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.invokeContract({
              abi: { invalid_abi: "abi" },
              args: MINT_NFT_ARGS,
              method: VALID_CONTRACT_INVOCATION_MODEL.method,
              contractAddress: VALID_CONTRACT_INVOCATION_MODEL.contract_address,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });
  });

  describe("#deployToken", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    let expectedSignedPayload: string;

    beforeAll(() => {
      Coinbase.apiClients.smartContract = smartContractApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();

      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
    });

    describe("when not using a server-signer", () => {
      beforeEach(async () => {
        Coinbase.useServerSigner = false;

        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);

        const tx = new Transaction(VALID_SMART_CONTRACT_ERC20_MODEL.transaction!);
        expectedSignedPayload = await tx.sign(key as unknown as ethers.Wallet);
      });

      describe("when it is successful", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC20_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC20_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployToken({
            name: ERC20_NAME,
            symbol: ERC20_SYMBOL,
            totalSupply: ERC20_TOTAL_SUPPLY,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc20,
              options: {
                name: ERC20_NAME,
                symbol: ERC20_SYMBOL,
                total_supply: ERC20_TOTAL_SUPPLY.toString(),
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is successful deploying a smart contract", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC20_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC20_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue(
            VALID_SMART_CONTRACT_ERC20_MODEL,
          );

          smartContract = await walletAddress.deployToken({
            name: ERC20_NAME,
            symbol: ERC20_SYMBOL,
            totalSupply: ERC20_TOTAL_SUPPLY,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc20,
              options: {
                name: ERC20_NAME,
                symbol: ERC20_SYMBOL,
                total_supply: ERC20_TOTAL_SUPPLY.toString(),
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when no key is loaded", () => {
        beforeEach(() => {
          walletAddress = new WalletAddress(addressModel);
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployToken({
              name: ERC20_NAME,
              symbol: ERC20_SYMBOL,
              totalSupply: ERC20_TOTAL_SUPPLY,
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when it fails to create a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create smart contract: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployToken({
              name: ERC20_NAME,
              symbol: ERC20_SYMBOL,
              totalSupply: ERC20_TOTAL_SUPPLY,
            }),
          ).rejects.toThrow(APIError);
        });
      });

      describe("when it fails to broadcast a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "invalid_signed_payload",
                  message: "failed to broadcast smart contract: invalid signed payload",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployToken({
              name: ERC20_NAME,
              symbol: ERC20_SYMBOL,
              totalSupply: ERC20_TOTAL_SUPPLY,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });

    describe("when using a server-signer", () => {
      let smartContract;

      beforeEach(async () => {
        Coinbase.useServerSigner = true;

        walletAddress = new WalletAddress(addressModel);
      });

      describe("when it is successful", () => {
        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC20_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployToken({
            name: ERC20_NAME,
            symbol: ERC20_SYMBOL,
            totalSupply: ERC20_TOTAL_SUPPLY,
          });
        });

        it("returns a pending contract invocation", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC20_MODEL.smart_contract_id);
          expect(smartContract.getTransaction().getStatus()).toBe(TransactionStatus.PENDING);
        });

        it("creates a contract invocation", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc20,
              options: {
                name: ERC20_NAME,
                symbol: ERC20_SYMBOL,
                total_supply: ERC20_TOTAL_SUPPLY.toString(),
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when creating a contract invocation fails", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create contract invocation: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployToken({
              name: ERC20_NAME,
              symbol: ERC20_SYMBOL,
              totalSupply: ERC20_TOTAL_SUPPLY,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });
  });

  describe("#deployNFT", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    let expectedSignedPayload: string;

    beforeAll(() => {
      Coinbase.apiClients.smartContract = smartContractApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();

      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
    });

    describe("when not using a server-signer", () => {
      beforeEach(async () => {
        Coinbase.useServerSigner = false;

        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);

        const tx = new Transaction(VALID_SMART_CONTRACT_ERC721_MODEL.transaction!);
        expectedSignedPayload = await tx.sign(key as unknown as ethers.Wallet);
      });

      describe("when it is successful", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC721_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC721_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployNFT({
            name: ERC721_NAME,
            symbol: ERC721_SYMBOL,
            baseURI: ERC721_BASE_URI,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC721_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc721,
              options: {
                name: ERC721_NAME,
                symbol: ERC721_SYMBOL,
                base_uri: ERC721_BASE_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC721_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is successful deploying a smart contract", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC721_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC721_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue(
            VALID_SMART_CONTRACT_ERC721_MODEL,
          );

          smartContract = await walletAddress.deployNFT({
            name: ERC721_NAME,
            symbol: ERC721_SYMBOL,
            baseURI: ERC721_BASE_URI,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC721_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc721,
              options: {
                name: ERC721_NAME,
                symbol: ERC721_SYMBOL,
                base_uri: ERC721_BASE_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC721_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when no key is loaded", () => {
        beforeEach(() => {
          walletAddress = new WalletAddress(addressModel);
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployNFT({
              name: ERC721_NAME,
              symbol: ERC721_SYMBOL,
              baseURI: ERC721_BASE_URI,
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when it fails to create a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create smart contract: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployNFT({
              name: ERC721_NAME,
              symbol: ERC721_SYMBOL,
              baseURI: ERC721_BASE_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });

      describe("when it fails to broadcast a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "invalid_signed_payload",
                  message: "failed to broadcast smart contract: invalid signed payload",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployNFT({
              name: ERC721_NAME,
              symbol: ERC721_SYMBOL,
              baseURI: ERC721_BASE_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });

    describe("when using a server-signer", () => {
      let smartContract;

      beforeEach(async () => {
        Coinbase.useServerSigner = true;

        walletAddress = new WalletAddress(addressModel);
      });

      describe("when it is successful", () => {
        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC721_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployNFT({
            name: ERC721_NAME,
            symbol: ERC721_SYMBOL,
            baseURI: ERC721_BASE_URI,
          });
        });

        it("returns a pending contract invocation", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC721_MODEL.smart_contract_id);
          expect(smartContract.getTransaction().getStatus()).toBe(TransactionStatus.PENDING);
        });

        it("creates a contract invocation", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc721,
              options: {
                name: ERC721_NAME,
                symbol: ERC721_SYMBOL,
                base_uri: ERC721_BASE_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when creating a contract invocation fails", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create contract invocation: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployNFT({
              name: ERC721_NAME,
              symbol: ERC721_SYMBOL,
              baseURI: ERC721_BASE_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });
  });

  describe("#deployMultiToken", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    let expectedSignedPayload: string;

    beforeAll(() => {
      Coinbase.apiClients.smartContract = smartContractApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();

      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
    });

    describe("when not using a server-signer", () => {
      beforeEach(async () => {
        Coinbase.useServerSigner = false;

        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);

        const tx = new Transaction(VALID_SMART_CONTRACT_ERC1155_MODEL.transaction!);
        expectedSignedPayload = await tx.sign(key as unknown as ethers.Wallet);
      });

      describe("when it is successful", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC1155_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC1155_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployMultiToken({
            uri: ERC1155_URI,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC1155_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc1155,
              options: {
                uri: ERC1155_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC1155_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is successful deploying a smart contract", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC1155_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC1155_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue(
            VALID_SMART_CONTRACT_ERC1155_MODEL,
          );

          smartContract = await walletAddress.deployMultiToken({
            uri: ERC1155_URI,
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC1155_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc1155,
              options: {
                uri: ERC1155_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_ERC1155_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when no key is loaded", () => {
        beforeEach(() => {
          walletAddress = new WalletAddress(addressModel);
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployMultiToken({
              uri: ERC1155_URI,
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when it fails to create a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create smart contract: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployMultiToken({
              uri: ERC1155_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });

      describe("when it fails to broadcast a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_CONTRACT_INVOCATION_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "invalid_signed_payload",
                  message: "failed to broadcast smart contract: invalid signed payload",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployMultiToken({
              uri: ERC1155_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });

    describe("when using a server-signer", () => {
      let smartContract;

      beforeEach(async () => {
        Coinbase.useServerSigner = true;

        walletAddress = new WalletAddress(addressModel);
      });

      describe("when it is successful", () => {
        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_ERC1155_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployMultiToken({
            uri: ERC1155_URI,
          });
        });

        it("returns a pending contract invocation", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_ERC1155_MODEL.smart_contract_id);
          expect(smartContract.getTransaction().getStatus()).toBe(TransactionStatus.PENDING);
        });

        it("creates a contract invocation", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Erc1155,
              options: {
                uri: ERC1155_URI,
              },
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when creating a contract invocation fails", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create contract invocation: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployMultiToken({
              uri: ERC1155_URI,
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });
  });

  describe("#deployContract", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    let expectedSignedPayload: string;

    beforeAll(() => {
      Coinbase.apiClients.smartContract = smartContractApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();

      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
    });

    describe("when not using a server-signer", () => {
      beforeEach(async () => {
        Coinbase.useServerSigner = false;

        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);

        const tx = new Transaction(VALID_SMART_CONTRACT_CUSTOM_MODEL.transaction!);
        expectedSignedPayload = await tx.sign(key as unknown as ethers.Wallet);
      });

      describe("when it is successful", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.compileSmartContract = mockReturnValue({
            ...VALID_COMPILED_CONTRACT_MODEL,
          });

          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployContract({
            solidityVersion: "0.8.0",
            solidityInputJson: "{}",
            contractName: "TestContract",
            constructorArgs: {
              arg1: "arg1",
              arg2: "arg2",
            },
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_CUSTOM_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Custom,
              options: `{"arg1":"arg1","arg2":"arg2"}`,
              compiled_smart_contract_id: "test-compiled-contract-1",
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_CUSTOM_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when it is successful deploying a smart contract", () => {
        let smartContract;

        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            deployer_address: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.getSmartContract = mockReturnValue(
            VALID_SMART_CONTRACT_CUSTOM_MODEL,
          );

          smartContract = await walletAddress.deployContract({
            solidityVersion: "0.8.0",
            solidityInputJson: "{}",
            contractName: "TestContract",
            constructorArgs: {
              arg1: "arg1",
              arg2: "arg2",
            },
          });
        });

        it("returns a smart contract", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_CUSTOM_MODEL.smart_contract_id);
        });

        it("creates the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Custom,
              options: `{"arg1":"arg1","arg2":"arg2"}`,
              compiled_smart_contract_id: "test-compiled-contract-1",
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });

        it("broadcasts the smart contract", async () => {
          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            VALID_SMART_CONTRACT_CUSTOM_MODEL.smart_contract_id,
            {
              signed_payload: expectedSignedPayload,
            },
          );

          expect(Coinbase.apiClients.smartContract!.deploySmartContract).toHaveBeenCalledTimes(1);
        });
      });

      describe("when no key is loaded", () => {
        beforeEach(() => {
          walletAddress = new WalletAddress(addressModel);
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployContract({
              solidityVersion: "0.8.0",
              solidityInputJson: "{}",
              contractName: "TestContract",
              constructorArgs: ["arg1", "arg2"],
            }),
          ).rejects.toThrow(Error);
        });
      });

      describe("when it fails to create a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "malformed_request",
                  message: "failed to create smart contract: invalid abi",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployContract({
              solidityVersion: "0.8.0",
              solidityInputJson: "{}",
              contractName: "TestContract",
              constructorArgs: ["arg1", "arg2"],
            }),
          ).rejects.toThrow(APIError);
        });
      });

      describe("when it fails to broadcast a smart contract", () => {
        beforeEach(() => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          Coinbase.apiClients.smartContract!.deploySmartContract = mockReturnRejectedValue(
            new APIError({
              response: {
                status: 400,
                data: {
                  code: "invalid_signed_payload",
                  message: "failed to broadcast smart contract: invalid signed payload",
                },
              },
            } as AxiosError),
          );
        });

        it("throws an error", async () => {
          await expect(
            walletAddress.deployContract({
              solidityVersion: "0.8.0",
              solidityInputJson: "{}",
              contractName: "TestContract",
              constructorArgs: ["arg1", "arg2"],
            }),
          ).rejects.toThrow(APIError);
        });
      });
    });
    describe("when using a server-signer", () => {
      let smartContract;

      beforeEach(() => {
        Coinbase.useServerSigner = true;
        walletAddress = new WalletAddress(addressModel);
      });

      describe("when it is successful", () => {
        beforeEach(async () => {
          Coinbase.apiClients.smartContract!.createSmartContract = mockReturnValue({
            ...VALID_SMART_CONTRACT_CUSTOM_MODEL,
            address_id: walletAddress.getId(),
            wallet_id: walletAddress.getWalletId(),
          });

          smartContract = await walletAddress.deployContract({
            solidityVersion: "0.8.0",
            solidityInputJson: "{}",
            contractName: "TestContract",
            constructorArgs: {
              arg1: "arg1",
              arg2: "arg2",
            },
          });
        });

        it("returns a pending contract invocation", async () => {
          expect(smartContract).toBeInstanceOf(SmartContract);
          expect(smartContract.getId()).toBe(VALID_SMART_CONTRACT_CUSTOM_MODEL.smart_contract_id);
          expect(smartContract.getTransaction().getStatus()).toBe(TransactionStatus.PENDING);
        });

        it("creates a contract invocation", async () => {
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledWith(
            walletAddress.getWalletId(),
            walletAddress.getId(),
            {
              type: SmartContractType.Custom,
              options: `{"arg1":"arg1","arg2":"arg2"}`,
              compiled_smart_contract_id: "test-compiled-contract-1",
            },
          );
          expect(Coinbase.apiClients.smartContract!.createSmartContract).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe("#createPayloadSignature", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    const unsignedPayload = VALID_PAYLOAD_SIGNATURE_MODEL.unsigned_payload;
    let signature: string;

    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("when not using a server-signer", () => {
      beforeEach(() => {
        addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
        walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);
        signature = key.signingKey.sign(unsignedPayload).serialized;
        Coinbase.useServerSigner = false;
      });

      it("should successfully create a payload signature", async () => {
        Coinbase.apiClients.address!.createPayloadSignature = mockReturnValue(
          VALID_PAYLOAD_SIGNATURE_MODEL,
        );

        const payloadSignature = await walletAddress.createPayloadSignature(unsignedPayload);

        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
          walletAddress.getWalletId(),
          walletAddress.getId(),
          {
            unsigned_payload: unsignedPayload,
            signature,
          },
        );
        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledTimes(1);
        expect(payloadSignature).toBeInstanceOf(PayloadSignature);
      });

      it("should throw an error when no key is loaded", async () => {
        walletAddress = new WalletAddress(addressModel);

        expect(async () => {
          await walletAddress.createPayloadSignature(unsignedPayload);
        }).rejects.toThrow(Error);
      });

      it("should throw an APIError when the API call to create a payload signature fails", async () => {
        Coinbase.apiClients.address!.createPayloadSignature = mockReturnRejectedValue(
          new APIError("Failed to create payload signature"),
        );

        expect(async () => {
          await walletAddress.createPayloadSignature(unsignedPayload);
        }).rejects.toThrow(Error);

        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
          walletAddress.getWalletId(),
          walletAddress.getId(),
          {
            unsigned_payload: unsignedPayload,
            signature,
          },
        );
        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledTimes(1);
      });
    });

    describe("when using a server-signer", () => {
      beforeEach(() => {
        addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
        walletAddress = new WalletAddress(addressModel);
        Coinbase.useServerSigner = true;
      });

      it("should successfully create a payload signature", async () => {
        Coinbase.apiClients.address!.createPayloadSignature = mockReturnValue(
          VALID_PAYLOAD_SIGNATURE_MODEL,
        );

        const payloadSignature = await walletAddress.createPayloadSignature(unsignedPayload);

        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
          walletAddress.getWalletId(),
          walletAddress.getId(),
          {
            unsigned_payload: unsignedPayload,
          },
        );
        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledTimes(1);
        expect(payloadSignature).toBeInstanceOf(PayloadSignature);
      });

      it("should throw an APIError when the API call to create a payload signature fails", async () => {
        Coinbase.apiClients.address!.createPayloadSignature = mockReturnRejectedValue(
          new APIError("Failed to create payload signature"),
        );

        expect(async () => {
          await walletAddress.createPayloadSignature(unsignedPayload);
        }).rejects.toThrow(Error);

        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
          walletAddress.getWalletId(),
          walletAddress.getId(),
          {
            unsigned_payload: unsignedPayload,
          },
        );
        expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("#getPayloadSignature", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;
    const payloadSignatureId = VALID_PAYLOAD_SIGNATURE_MODEL.payload_signature_id;

    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
      walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);
      Coinbase.useServerSigner = false;
      jest.clearAllMocks();
    });

    it("should successfully get the payload signature", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnValue(
        VALID_PAYLOAD_SIGNATURE_MODEL,
      );

      const payloadSignature = await walletAddress.getPayloadSignature(payloadSignatureId);

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        walletAddress.getWalletId(),
        walletAddress.getId(),
        payloadSignatureId,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
      expect(payloadSignature).toBeInstanceOf(PayloadSignature);
    });

    it("should throw an APIError when the API call to get the payload signature fails", async () => {
      Coinbase.apiClients.address!.getPayloadSignature = mockReturnRejectedValue(
        new APIError("Failed to get payload signature"),
      );

      expect(async () => {
        await walletAddress.getPayloadSignature(payloadSignatureId);
      }).rejects.toThrow(Error);

      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledWith(
        walletAddress.getWalletId(),
        walletAddress.getId(),
        payloadSignatureId,
      );
      expect(Coinbase.apiClients.address!.getPayloadSignature).toHaveBeenCalledTimes(1);
    });
  });

  describe("#listPayloadSignatures", () => {
    const key = ethers.Wallet.createRandom();
    let addressModel: AddressModel;
    let walletAddress: WalletAddress;

    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      addressModel = newAddressModel(randomUUID(), randomUUID(), Coinbase.networks.BaseSepolia);
      walletAddress = new WalletAddress(addressModel, key as unknown as ethers.Wallet);
      Coinbase.useServerSigner = false;
      jest.clearAllMocks();
    });

    it("should successfully list payload signatures", async () => {
      Coinbase.apiClients.address!.listPayloadSignatures = mockReturnValue(
        VALID_PAYLOAD_SIGNATURE_LIST,
      );

      const paginationResponse = await walletAddress.listPayloadSignatures();

      expect(Coinbase.apiClients.address!.listPayloadSignatures).toHaveBeenCalledTimes(1);
      expect(paginationResponse.data).toHaveLength(VALID_PAYLOAD_SIGNATURE_LIST.data.length);
      expect(paginationResponse.hasMore).toBe(false);
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should throw an APIError when the API call to list payload signatures fails", async () => {
      Coinbase.apiClients.address!.listPayloadSignatures = mockReturnRejectedValue(
        new APIError("Failed to list payload signatures"),
      );

      expect(async () => {
        await walletAddress.listPayloadSignatures();
      }).rejects.toThrow(Error);

      expect(Coinbase.apiClients.address!.listPayloadSignatures).toHaveBeenCalledTimes(1);
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as crypto from "crypto";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { FaucetTransaction } from "../coinbase/faucet_transaction";
import {
  Balance as BalanceModel,
  FetchStakingRewards200Response,
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
import { ArgumentError, InternalError } from "../coinbase/errors";
import {
  addressesApiMock,
  assetsApiMock,
  externalAddressApiMock,
  generateRandomHash,
  getAssetMock,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  stakeApiMock,
  tradeApiMock,
  transfersApiMock,
  VALID_ADDRESS_BALANCE_LIST,
  VALID_ADDRESS_MODEL,
  VALID_TRANSFER_MODEL,
  VALID_WALLET_MODEL,
  walletsApiMock,
} from "./utils";
import { Transfer } from "../coinbase/transfer";
import { StakeOptionsMode, TransactionStatus, TransferStatus } from "../coinbase/types";
import { Trade } from "../coinbase/trade";
import { Transaction } from "../coinbase/transaction";
import { WalletAddress } from "../coinbase/address/wallet_address";
import { Wallet } from "../coinbase/wallet";
import { StakingOperation } from "../coinbase/staking_operation";
import { StakingReward } from "../coinbase/staking_reward";

// Test suite for the WalletAddress class
describe("WalletAddress", () => {
  const transactionHash = generateRandomHash();
  let address: WalletAddress;
  let balanceModel: BalanceModel;
  let key;

  beforeEach(() => {
    Coinbase.apiClients.externalAddress = externalAddressApiMock;
    Coinbase.apiClients.asset = assetsApiMock;
    Coinbase.apiClients.externalAddress = externalAddressApiMock;
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
    Coinbase.apiClients.externalAddress.requestExternalFaucetFunds = mockFn(() => {
      return { data: { transaction_hash: transactionHash } };
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

  it("should throw an InternalError when model is not provided", () => {
    expect(() => new WalletAddress(null!, key as unknown as ethers.Wallet)).toThrow(
      `Address model cannot be empty`,
    );
  });

  it("should request funds from the faucet and returns the faucet transaction", async () => {
    const faucetTransaction = await address.faucet();
    expect(faucetTransaction).toBeInstanceOf(FaucetTransaction);
    expect(faucetTransaction.getTransactionHash()).toBe(transactionHash);
    expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledWith(
      address.getNetworkId(),
      address.getId(),
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

  it("should throw an InternalError when the request fails unexpectedly", async () => {
    Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnRejectedValue(
      new InternalError(""),
    );
    await expect(address.faucet()).rejects.toThrow(InternalError);
    expect(Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds).toHaveBeenCalledTimes(
      1,
    );
  });

  it("should return the correct string representation", () => {
    expect(address.toString()).toBe(
      `WalletAddress{ addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}', walletId: '${VALID_ADDRESS_MODEL.wallet_id}' }`,
    );
  });

  describe("#stakingOperation", () => {
    key = ethers.Wallet.createRandom();
    const newAddress = newAddressModel("", randomUUID(), Coinbase.networks.EthereumHolesky);
    const walletAddress = new WalletAddress(newAddress, key as unknown as ethers.Wallet);
    const STAKING_OPERATION_MODEL: StakingOperationModel = {
      id: randomUUID(),
      network_id: Coinbase.networks.EthereumHolesky,
      address_id: newAddress.address_id,
      status: StakingOperationStatusEnum.Complete,
      transactions: [
        {
          from_address_id: newAddress.address_id,
          network_id: Coinbase.networks.EthereumHolesky,
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
          amount: "3000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHolesky,
            decimals: 18,
            contract_address: "0x",
          },
        },
        unstakeable_balance: {
          amount: "2000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHolesky,
            decimals: 18,
            contract_address: "0x",
          },
        },
        claimable_balance: {
          amount: "1000000000000000000",
          asset: {
            asset_id: Coinbase.assets.Eth,
            network_id: Coinbase.networks.EthereumHolesky,
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
        },
        {
          address_id: newAddress.address_id,
          date: "2024-05-02",
          amount: "203",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Usd,
        },
        {
          address_id: newAddress.address_id,
          date: "2024-05-03",
          amount: "226",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Usd,
        },
      ],
      has_more: false,
      next_page: "",
    };

    beforeAll(() => {
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.stake = stakeApiMock;
      Coinbase.apiClients.asset = assetsApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      STAKING_OPERATION_MODEL.wallet_id = newAddress.wallet_id;
    });

    describe(".createStake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.stake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.stake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.stake!.getStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });

      it("should not create a staking operation from the address with zero amount", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);

        await expect(
          async () => await walletAddress.createStake(0.0, Coinbase.assets.Eth),
        ).rejects.toThrow(Error);
      });
    });

    describe(".createUnstake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.stake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.stake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.stake!.getStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createUnstake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe(".createClaimStake", () => {
      it("should create a staking operation from the address", async () => {
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.stake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.stake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.stake!.getStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await walletAddress.createClaimStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe(".stakeableBalance", () => {
      it("should return the stakeable balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.stakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("3"));
      });
    });

    describe(".unstakeableBalance", () => {
      it("should return the unstakeableBalance balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.unstakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("2"));
      });
    });

    describe(".claimableBalance", () => {
      it("should return the claimableBalance balance successfully with default params", async () => {
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await walletAddress.claimableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("1"));
      });
    });

    describe(".stakingRewards", () => {
      it("should successfully return staking rewards", async () => {
        Coinbase.apiClients.stake!.fetchStakingRewards = mockReturnValue(STAKING_REWARD_RESPONSE);
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        const response = await walletAddress.stakingRewards(Coinbase.assets.Eth);
        expect(response).toBeInstanceOf(Array<StakingReward>);
      });
    });
  });

  describe("#createTransfer", () => {
    let weiAmount, destination, intervalSeconds, timeoutSeconds;
    let walletId, id;

    beforeEach(() => {
      weiAmount = new Decimal("500000000000000000");
      destination = new WalletAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);
      intervalSeconds = 0.2;
      timeoutSeconds = 10;
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

      await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
        timeoutSeconds,
        intervalSeconds,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
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
          timeoutSeconds,
          intervalSeconds,
        }),
      ).rejects.toThrow(APIError);
    });

    it("should throw an InternalError if the address key is not provided", async () => {
      const addressWithoutKey = new WalletAddress(VALID_ADDRESS_MODEL, null!);
      await expect(
        addressWithoutKey.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
          timeoutSeconds,
          intervalSeconds,
        }),
      ).rejects.toThrow(InternalError);
    });

    it("it should successfully create and complete a transfer if using signer and key is not loaded", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      Coinbase.useServerSigner = true;
      const addressWithoutKey = new WalletAddress(VALID_ADDRESS_MODEL, null!);

      await addressWithoutKey.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
        timeoutSeconds,
        intervalSeconds,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
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
          timeoutSeconds,
          intervalSeconds,
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
          timeoutSeconds,
          intervalSeconds,
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
          timeoutSeconds,
          intervalSeconds,
        }),
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
        address.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
          timeoutSeconds,
          intervalSeconds,
        }),
      ).rejects.toThrow("Transfer timed out");
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        address.createTransfer({
          amount: insufficientAmount,
          assetId: Coinbase.assets.Wei,
          destination,
          timeoutSeconds,
          intervalSeconds,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create and complete a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await address.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
        timeoutSeconds,
        intervalSeconds,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe("#getTransfers", () => {
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
      const transfers = await address.listTransfers();
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
      await expect(address.listTransfers()).rejects.toThrow(APIError);
      expect(Coinbase.apiClients.transfer!.listTransfers).toHaveBeenCalledTimes(1);
    });
  });

  describe("#trade", () => {
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
      unsignedPayload = "unsigned_payload";
      signedPayload = "signed_payload";
      broadcastTradeRequest = { signed_payload: signedPayload };
      transaction = { sign: jest.fn().mockReturnValue(signedPayload) } as unknown as Transaction;
      approveTransaction = null;
      createdTrade = {
        id: tradeId,
        transaction: transaction,
        approve_transaction: approveTransaction,
      } as unknown as Trade;
      transactionModel = {
        status: "pending",
        unsigned_payload: unsignedPayload,
      } as unknown as TradeModel;
      tradeModel = {
        transaction: transactionModel,
        address_id: addressId,
      } as unknown as TradeModel;
      broadcastedTransactionModel = {
        status: "broadcast",
        unsigned_payload: unsignedPayload,
        signed_payload: signedPayload,
      } as unknown as TradeModel;
      broadcastedTradeModel = {
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
      useServerSigner = false;
    });

    describe("when the trade is successful", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        Coinbase.apiClients.asset = assetsApiMock;
        Coinbase.apiClients.trade = tradeApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue(balanceResponse);
        Coinbase.apiClients.trade!.createTrade = mockReturnValue(tradeModel);
        Coinbase.apiClients.asset.getAsset = getAssetMock();
        jest.spyOn(Transaction.prototype, "sign").mockReturnValue(signedPayload);
      });

      it("should return the broadcasted trade", async () => {
        Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
        const result = await address.createTrade(amount, fromAssetId, toAssetId);
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
      });

      it("should sign the transaction with the key", async () => {
        Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
        const result = await address.createTrade(amount, fromAssetId, toAssetId);
        const transaction = result.getTransaction();
        expect(transaction.sign).toHaveBeenCalledWith(key);
      });

      describe("when the asset is Gwei", () => {
        beforeEach(() => {
          fromAssetId = "gwei";
          normalizedFromAssetId = "eth";
          amount = new Decimal(500000000);
        });

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `500000000000000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          expect(transaction.sign).toHaveBeenCalledWith(key);
        });
      });

      describe("when the asset is ETH", () => {
        beforeEach(() => {
          fromAssetId = "eth";
          normalizedFromAssetId = "eth";
          amount = new Decimal(0.5);
        });

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `500000000000000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          expect(transaction.sign).toHaveBeenCalledWith(key);
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

        it("should return the broadcast trade", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          await address.createTrade(amount, fromAssetId, toAssetId);
          expect(Coinbase.apiClients.trade!.createTrade).toHaveBeenCalledWith(
            address.getWalletId(),
            address.getId(),
            {
              amount: `5000000`,
              from_asset_id: normalizedFromAssetId,
              to_asset_id: toAssetId,
            },
          );
        });

        it("should sign the transaction with the address key", async () => {
          Coinbase.apiClients.trade!.broadcastTrade = mockReturnValue(broadcastedTradeModel);
          const result = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = result.getTransaction();
          expect(transaction.sign).toHaveBeenCalledWith(key);
        });
      });

      describe("when there is an approve transaction", () => {
        let approveSignedPayload;

        beforeEach(() => {
          approveSignedPayload = "approve_signed_payload";
          approveTransaction = { sign: jest.fn().mockReturnValue(approveSignedPayload) };
          broadcastedTradeModel = {
            ...broadcastedTradeModel,
            approve_transaction: approveTransaction,
          };
        });

        it("should sign the trade transaction with the address key", async () => {
          const trade = await address.createTrade(amount, fromAssetId, toAssetId);
          const transaction = trade.getTransaction();
          expect(transaction.sign).toHaveBeenCalledWith(key);
        });
      });
    });

    describe("when the address cannot sign", () => {
      it("should raise an Error", async () => {
        const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, null!);
        await expect(newAddress.createTrade(new Decimal(100), "eth", "usdc")).rejects.toThrow(
          Error,
        );
      });
    });

    describe("when the to fromAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(address.createTrade(new Decimal(100), "XYZ", "eth")).rejects.toThrow(Error);
      });
    });

    describe("when the to toAssetId is unsupported", () => {
      it("should raise an ArgumentError", async () => {
        await expect(address.createTrade(new Decimal(100), "eth", "XYZ")).rejects.toThrow(Error);
      });
    });

    describe("when the balance is insufficient", () => {
      beforeAll(() => {
        Coinbase.apiClients.address = addressesApiMock;
        Coinbase.apiClients.address!.getAddressBalance = mockReturnValue({ amount: "0" });
      });
      it("should raise an Error", async () => {
        await expect(address.createTrade(new Decimal(100), "eth", "usdc")).rejects.toThrow(Error);
      });
    });

    describe(".setKey", () => {
      it("should set the key successfully", () => {
        key = ethers.Wallet.createRandom();
        const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, undefined);
        expect(() => {
          newAddress.setKey(key);
        }).not.toThrow(InternalError);
      });
      it("should not set the key successfully", () => {
        key = ethers.Wallet.createRandom();
        const newAddress = new WalletAddress(VALID_ADDRESS_MODEL, key);
        expect(() => {
          newAddress.setKey(key);
        }).toThrow(InternalError);
      });
    });
  });
});

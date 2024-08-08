import { Coinbase } from "../coinbase/coinbase";
import {
  assetsApiMock,
  externalAddressApiMock,
  generateRandomHash,
  getAssetMock,
  mockEthereumValidator,
  mockReturnValue,
  newAddressModel,
  stakeApiMock,
  VALID_ACTIVE_VALIDATOR_LIST,
  VALID_ADDRESS_MODEL,
  validatorApiMock,
} from "./utils";
import {
  AddressBalanceList,
  Balance,
  AddressHistoricalBalanceList,
  HistoricalBalance,
  FetchStakingRewards200Response,
  StakingContext as StakingContextModel,
  StakingOperation as StakingOperationModel,
  StakingRewardFormat,
  StakingRewardStateEnum,
} from "../client";
import Decimal from "decimal.js";
import { ExternalAddress } from "../coinbase/address/external_address";
import { StakeOptionsMode } from "../coinbase/types";
import { StakingOperation } from "../coinbase/staking_operation";
import { Asset } from "../coinbase/asset";
import { randomUUID } from "crypto";
import { StakingReward } from "../coinbase/staking_reward";

describe("ExternalAddress", () => {
  const newAddress = newAddressModel("", randomUUID(), Coinbase.networks.EthereumHolesky);

  const address = new ExternalAddress(newAddress.network_id, newAddress.address_id);
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
  const STAKING_OPERATION_MODEL: StakingOperationModel = {
    id: randomUUID(),
    network_id: Coinbase.networks.EthereumHolesky,
    address_id: "0x1234567890",
    status: "pending",
    transactions: [
      {
        from_address_id: address.getId(),
        network_id: address.getNetworkId(),
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
  const startTime = "2024-05-01T00:00:00Z";
  const endTime = "2024-05-21T00:00:00Z";
  const STAKING_REWARD_RESPONSE: FetchStakingRewards200Response = {
    data: [
      {
        address_id: address.getId(),
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
        address_id: address.getId(),
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
        address_id: address.getId(),
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

  beforeAll(() => {
    Coinbase.apiClients.stake = stakeApiMock;
    Coinbase.apiClients.asset = assetsApiMock;
    Coinbase.apiClients.validator = validatorApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(".buildStakeOperation", () => {
    it("should successfully build a stake operation", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const op = await address.buildStakeOperation(
        new Decimal("0.0001"),
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
      );

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.PARTIAL,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        action: "stake",
        options: {
          mode: StakeOptionsMode.PARTIAL,
          amount: "100000000000000",
        },
      });

      expect(op).toBeInstanceOf(StakingOperation);
    });

    it("should return an error for not enough amount to stake", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);

      await expect(
        address.buildStakeOperation(new Decimal("3.1"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });

    it("should return an error for trying to stake less than or equal to zero", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

      await expect(
        address.buildStakeOperation(new Decimal("0"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe(".buildUnstakeOperation", () => {
    it("should successfully build a unstake operation", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const op = await address.buildUnstakeOperation(new Decimal("0.0001"), Coinbase.assets.Eth);

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        action: "unstake",
        options: {
          mode: StakeOptionsMode.DEFAULT,
          amount: "100000000000000",
        },
      });
      expect(op).toBeInstanceOf(StakingOperation);
    });

    it("should return an error for not enough amount to unstake", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);

      await expect(
        address.buildUnstakeOperation(new Decimal("2.1"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });

    it("should return an error for trying to unstake less than or equal to zero", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

      await expect(
        address.buildUnstakeOperation(new Decimal("0"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe(".buildClaimStakeOperation", () => {
    it("should successfully build a claim stake operation", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const op = await address.buildClaimStakeOperation(new Decimal("0.0001"), Coinbase.assets.Eth);

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        action: "claim_stake",
        options: {
          mode: StakeOptionsMode.DEFAULT,
          amount: "100000000000000",
        },
      });
      expect(op).toBeInstanceOf(StakingOperation);
    });

    it("should return an error for not enough amount to claim stake", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);

      await expect(
        address.buildClaimStakeOperation(new Decimal("1.1"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });

    it("should return an error for trying to claim stake less than or equal to zero", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);

      await expect(
        address.buildClaimStakeOperation(new Decimal("0"), Coinbase.assets.Eth),
      ).rejects.toThrow(Error);

      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
      expect(Coinbase.apiClients.stake!.buildStakingOperation).toHaveBeenCalledTimes(0);
    });

    it("should return an error for trying to claim stake for native eth", async () => {
      await expect(
        address.buildClaimStakeOperation(
          new Decimal("0"),
          Coinbase.assets.Eth,
          StakeOptionsMode.NATIVE,
        ),
      ).rejects.toThrow(Error);
    });
  });

  describe(".stakingRewards", () => {
    it("should return staking rewards successfully", async () => {
      Coinbase.apiClients.stake!.fetchStakingRewards = mockReturnValue(STAKING_REWARD_RESPONSE);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await address.stakingRewards(Coinbase.assets.Eth, startTime, endTime);

      expect(response).toBeInstanceOf(Array<StakingReward>);
      expect(response.length).toEqual(3);
      expect(Coinbase.apiClients.stake!.fetchStakingRewards).toHaveBeenCalledWith(
        {
          network_id: address.getNetworkId(),
          asset_id: Coinbase.assets.Eth,
          address_ids: [address.getId()],
          start_time: startTime,
          end_time: endTime,
          format: StakingRewardFormat.Usd,
        },
        100,
        undefined,
      );
    });
  });

  describe(".listBalances", () => {
    beforeEach(() => {
      const mockBalanceResponse: AddressBalanceList = {
        data: [
          {
            amount: "1000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 18,
            },
          },
          {
            amount: "5000000",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
        total_count: 2,
      };
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.externalAddress!.listExternalAddressBalances =
        mockReturnValue(mockBalanceResponse);
    });

    it("should return 0 balance if no balances", async () => {
      Coinbase.apiClients.externalAddress!.listExternalAddressBalances = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
        total_count: 0,
      });
      const balanceMap = await address.listBalances();
      expect(balanceMap.size).toEqual(0);
      expect(
        Coinbase.apiClients.externalAddress!.listExternalAddressBalances,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listExternalAddressBalances).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
      );
    });

    it("should return results with an ETH and USDC balance", async () => {
      const balanceMap = await address.listBalances();
      expect(balanceMap.get("eth")).toEqual(new Decimal(1));
      expect(balanceMap.get("usdc")).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.externalAddress!.listExternalAddressBalances,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listExternalAddressBalances).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
      );
    });
  });

  describe(".listHistoricalBalance", () => {
    beforeEach(() => {
      const mockHistoricalBalanceResponse: AddressHistoricalBalanceList = {
        data: [
          {
            amount: "1000000",
            block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
            block_height:"12345",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height:"67890",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
      };
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance =
        mockReturnValue(mockHistoricalBalanceResponse);
    });

    it("should return results with USDC historical balance", async () => {
      const history = await address.listHistoricalBalance(Coinbase.assets.Usdc);
      expect(history.length).toEqual(2);
      expect(history[0].amount).toEqual(new Decimal(1));
      expect(history[1].amount).toEqual(new Decimal(5));
      expect(
        Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
    });

    it("should return empty if no historical balance found", async () => {
      Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance = mockReturnValue({
        data: [],
        has_more: false,
        next_page: "",
      });
      const history = await address.listHistoricalBalance(Coinbase.assets.Usdc);
      expect(history.length).toEqual(0);
      expect(
        Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance,
      ).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.externalAddress!.listAddressHistoricalBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Usdc,
        100,
        undefined,
      );
    });
  });

  describe(".getBalance", () => {
    beforeEach(() => {
      const mockWalletBalance: Balance = {
        amount: "5000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.EthereumHolesky,
          decimals: 18,
        },
      };
      Coinbase.apiClients.externalAddress!.getExternalAddressBalance =
        mockReturnValue(mockWalletBalance);
    });

    it("should return the correct ETH balance", async () => {
      const balanceMap = await address.getBalance(Coinbase.assets.Eth);
      expect(balanceMap).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Asset.primaryDenomination(Coinbase.assets.Eth),
      );
    });

    it("should return the correct GWEI balance", async () => {
      const balance = await address.getBalance(Coinbase.assets.Gwei);
      expect(balance).toEqual(new Decimal(5000000000));
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Eth,
      );
    });

    it("should return the correct WEI balance", async () => {
      const balance = await address.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(new Decimal(5000000000000000000));
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Eth,
      );
    });

    it("should return 0 when the balance is not found", async () => {
      Coinbase.apiClients.externalAddress!.getExternalAddressBalance = mockReturnValue(null);
      const balance = await address.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(new Decimal(0));
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledTimes(
        1,
      );
      expect(Coinbase.apiClients.externalAddress!.getExternalAddressBalance).toHaveBeenCalledWith(
        address.getNetworkId(),
        address.getId(),
        Coinbase.assets.Eth,
      );
    });
  });

  describe(".faucet", () => {
    beforeEach(() => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnValue({
        transaction_hash: generateRandomHash(8),
      });
    });

    it("should successfully request funds from the faucet", async () => {
      const transaction = await address.faucet();
      expect(transaction.getTransactionHash()).toEqual(expect.any(String));
    });

    it("should throw an error if the faucet request fails", async () => {
      Coinbase.apiClients.externalAddress!.requestExternalFaucetFunds = mockReturnValue(null);
      await expect(address.faucet()).rejects.toThrow(Error);
    });
  });

  describe(".stakeableBalance", () => {
    it("should return the stakeable balance successfully with default params", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const stakeableBalance = await address.stakeableBalance(Coinbase.assets.Eth);
      expect(stakeableBalance).toEqual(new Decimal("3"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
    });

    it("should return the stakeable balance successfully in DEFAULT/PARTIAL mode", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const stakeableBalance = await address.stakeableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
        {},
      );
      expect(stakeableBalance).toEqual(new Decimal("3"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.PARTIAL,
        },
      });
    });
  });

  describe(".unstakeableBalance", () => {
    it("should return the unstakeable balance successfully with default params", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const unstakeableBalance = await address.unstakeableBalance(Coinbase.assets.Eth);
      expect(unstakeableBalance).toEqual(new Decimal("2"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
    });

    it("should return the unstakeable balance successfully in DEFAULT/PARTIAL mode", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const unstakeableBalance = await address.unstakeableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.PARTIAL,
        {},
      );
      expect(unstakeableBalance).toEqual(new Decimal("2"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.PARTIAL,
        },
      });
    });
  });

  describe(".claimableBalance", () => {
    it("should return the claimable balance successfully with default params", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const claimableBalance = await address.claimableBalance(Coinbase.assets.Eth);
      expect(claimableBalance).toEqual(new Decimal("1"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
    });

    it("should return the claimable balance successfully in DEFAULT/PARTIAL mode", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      const claimableBalance = await address.claimableBalance(
        Coinbase.assets.Eth,
        StakeOptionsMode.DEFAULT,
        {},
      );
      expect(claimableBalance).toEqual(new Decimal("1"));
      expect(Coinbase.apiClients.stake!.getStakingContext).toHaveBeenCalledWith({
        address_id: address.getId(),
        network_id: address.getNetworkId(),
        asset_id: Coinbase.assets.Eth,
        options: {
          mode: StakeOptionsMode.DEFAULT,
        },
      });
    });
  });
});

import {
  FetchStakingRewards200Response,
  StakingRewardFormat,
  StakingRewardStateEnum,
} from "../client";
import { Coinbase } from "../coinbase/coinbase";
import {
  assetsApiMock,
  getAssetMock,
  mockFn,
  mockReturnValue,
  newAddressModel,
  stakeApiMock,
} from "./utils";
import { StakingReward } from "../coinbase/staking_reward";
import { ExternalAddress } from "../coinbase/address/external_address";
import { Asset } from "../coinbase/asset";
import Decimal from "decimal.js";

describe("StakingReward", () => {
  const startTime = "2024-05-01T00:00:00Z";
  const endTime = "2024-05-21T00:00:00Z";
  const newAddress = newAddressModel("", "some-address-id", Coinbase.networks.EthereumHolesky);
  const address = new ExternalAddress(newAddress.network_id, newAddress.address_id);
  const asset = Asset.fromModel({
    asset_id: Coinbase.assets.Eth,
    network_id: address.getNetworkId(),
    contract_address: "0x",
    decimals: 18,
  });
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(".list", () => {
    it("should successfully return staking rewards", async () => {
      Coinbase.apiClients.stake!.fetchStakingRewards = mockReturnValue(STAKING_REWARD_RESPONSE);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await StakingReward.list(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        [address.getId()],
        startTime,
        endTime,
      );
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
    it("should successfully return staking rewards for multiple pages", async () => {
      const pages = ["abc", "def"];
      Coinbase.apiClients.stake!.fetchStakingRewards = mockFn(() => {
        STAKING_REWARD_RESPONSE.next_page = pages.shift() as string;
        STAKING_REWARD_RESPONSE.has_more = !!STAKING_REWARD_RESPONSE.next_page;
        return { data: STAKING_REWARD_RESPONSE };
      });
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await StakingReward.list(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        [address.getId()],
        startTime,
        endTime,
      );
      expect(response).toBeInstanceOf(Array<StakingReward>);
      expect(response.length).toEqual(9);
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

  describe(".amount", () => {
    it("should return the correct amount for USD", () => {
      const reward = new StakingReward(
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
        asset,
        StakingRewardFormat.Usd,
      );

      const amount = reward.amount();
      expect(amount).toEqual(new Decimal("2.26"));
    });

    it("should return the correct amount for native format", () => {
      const reward = new StakingReward(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          amount: "726030823305604",
          state: StakingRewardStateEnum.Pending,
          format: StakingRewardFormat.Native,
          usd_value: {
            amount: "179",
            conversion_price: "2461.63",
            conversion_time: "2024-05-02T00:00:00Z",
          },
        },
        asset,
        StakingRewardFormat.Native,
      );

      const amount = reward.amount();
      expect(amount).toEqual(0.000726030823305604);
    });
  });

  describe(".date", () => {
    it("should return the correct date", () => {
      const reward = new StakingReward(
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
        asset,
        StakingRewardFormat.Usd,
      );

      const date = reward.date();
      expect(date).toEqual(new Date("2024-05-03"));
    });
  });

  describe(".toString", () => {
    it("should return the string representation of a staking reward", () => {
      const reward = new StakingReward(
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
        asset,
        StakingRewardFormat.Usd,
      );

      const rewardStr = reward.toString();
      expect(rewardStr).toEqual(
        "StakingReward { date: '2024-05-03T00:00:00.000Z' address: 'some-address-id' amount: '2.26' usd_value: '2.26' conversion_price: '3000' conversion_date: '2024-05-03T00:00:00Z' }",
      );
    });
  });

  describe(".addressId", () => {
    it("should return the onchain address of the StakingReward", () => {
      const reward = new StakingReward(
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
        asset,
        StakingRewardFormat.Usd,
      );

      const addressId = reward.addressId();
      expect(addressId).toEqual(address.getId());
    });
  });
});

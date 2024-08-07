import {
  FetchStakingBalances200Response,
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
import { StakingBalance } from "../coinbase/staking_balance";
import { ExternalAddress } from "../coinbase/address/external_address";
import { Asset } from "../coinbase/asset";
import Decimal from "decimal.js";

describe("StakingBalance", () => {
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
  const STAKING_BALANCE_RESPONSE: FetchStakingBalances200Response = {
    data: [
      {
        address_id: address.getId(),
        date: "2024-05-01",
        bonded_stake: "666",
        unbonded_stake: "361",
        total_delegation: "100",
        participate_type: "validator",
      },
      {
        address_id: address.getId(),
        date: "2024-05-02",
        bonded_stake: "667",
        unbonded_stake: "362",
        total_delegation: "101",
        participate_type: "validator",
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
    it("should successfully return staking balances", async () => {
      Coinbase.apiClients.stake!.fetchStakingBalances = mockReturnValue(STAKING_BALANCE_RESPONSE);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await StakingBalance.list(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        address.getId(),
        startTime,
        endTime,
      );
      expect(response).toBeInstanceOf(Array<StakingBalance>);
      expect(response.length).toEqual(2);
      expect(Coinbase.apiClients.stake!.fetchStakingBalances).toHaveBeenCalledWith(
        {
          network_id: address.getNetworkId(),
          asset_id: Coinbase.assets.Eth,
          address_id: address.getId(),
          start_time: startTime,
          end_time: endTime,
        },
        100,
        undefined,
      );
    });
    it("should successfully return staking balances for multiple pages", async () => {
      const pages = ["abc", "def"];
      Coinbase.apiClients.stake!.fetchStakingBalances = mockFn(() => {
        STAKING_BALANCE_RESPONSE.next_page = pages.shift() as string;
        STAKING_BALANCE_RESPONSE.has_more = !!STAKING_BALANCE_RESPONSE.next_page;
        return { data: STAKING_BALANCE_RESPONSE };
      });
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await StakingBalance.list(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        address.getId(),
        startTime,
        endTime,
      );
      expect(response).toBeInstanceOf(Array<StakingBalance>);
      expect(response.length).toEqual(9);
      expect(Coinbase.apiClients.stake!.fetchStakingBalances).toHaveBeenCalledWith(
        {
          network_id: address.getNetworkId(),
          asset_id: Coinbase.assets.Eth,
          address_id: address.getId(),
          start_time: startTime,
          end_time: endTime,
        },
        100,
        undefined,
      );
    });
  });

  describe(".amount", () => {
    it("should return the correct bonded stake amount", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: "226",
          unbonded_stake: "1",
          total_delegation: "0",
          participate_type: "validator",
        },
        asset,
      );

      const bondedStake = balance.bondedStake();
      expect(bondedStake).toEqual(new Decimal("226"));

      const unbondedStake = balance.unbondedStake();
      expect(unbondedStake).toEqual(new Decimal("1"));

      const totalDelegation = balance.totalDelegation();
      expect(totalDelegation).toEqual(new Decimal("0"));

      const participateType = balance.participateType();
      expect(participateType).toEqual("validator");
    });
  });

  describe(".date", () => {
    it("should return the correct date", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: "226",
          unbonded_stake: "1",
          total_delegation: "0",
          participate_type: "validator",
        },
        asset,
      );

      const date = balance.date();
      expect(date).toEqual(new Date("2024-05-03"));
    });
  });

  describe(".toString", () => {
    it("should return the string representation of a staking balance", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: "226",
          unbonded_stake: "1",
          total_delegation: "0",
          participate_type: "validator",
        },
        asset,
      );

      const balanceStr = balance.toString();
      expect(balanceStr).toEqual(
        `StakingBalance { date: '2024-05-03' address: '${address.getId()}' bondedStake: '226' unbondedStake: '1' totalDelegation: '0' participateType: 'validator' }`,
      );
    });
  });

  describe(".addressId", () => {
    it("should return the onchain address of the StakingBalance", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: "226",
          unbonded_stake: "1",
          total_delegation: "0",
          participate_type: "validator",
        },
        asset,
      );

      const addressId = balance.addressId();
      expect(addressId).toEqual(address.getId());
    });
  });
});

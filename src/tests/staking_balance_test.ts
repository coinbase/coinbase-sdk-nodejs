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
import { AssetAmount } from "../coinbase/asset_amount";

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

  const bondedStake = new AssetAmount("3", "3000000000000000000", 18, "ETH");
  const unbondedStake = new AssetAmount("2", "2000000000000000000", 18, "ETH");
  const totalDelegation = new AssetAmount("1", "1000000000000000000", 18, "ETH");

  const STAKING_BALANCE_RESPONSE: FetchStakingBalances200Response = {
    data: [
      {
        address_id: address.getId(),
        date: "2024-05-01",
        bonded_stake: bondedStake,
        unbonded_stake: unbondedStake,
        total_delegation_received: totalDelegation,
        participate_type: "validator",
      },
      {
        address_id: address.getId(),
        date: "2024-05-02",
        bonded_stake: bondedStake,
        unbonded_stake: unbondedStake,
        total_delegation_received: totalDelegation,
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
      expect(response.length).toEqual(6);
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
    it("should return the correct stake amount", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: new AssetAmount("32", "32000000000000000000", 18, "ETH"),
          unbonded_stake: new AssetAmount("2", "2000000000000000000", 18, "ETH"),
          total_delegation_received: new AssetAmount("1", "1000000000000000000", 18, "ETH"),
          participate_type: "validator",
        },
        asset,
      );

      const bondedStake = balance.bondedStake();
    
      expect(bondedStake.getAmount()).toEqual("32");
      expect(bondedStake.getRawNumeric()).toEqual("32000000000000000000");
      expect(bondedStake.getExp()).toEqual(18);
      expect(bondedStake.getTicker()).toEqual("ETH");

      const unbondedStake = balance.unbondedStake();
      expect(unbondedStake.getAmount()).toEqual("2");
      expect(unbondedStake.getRawNumeric()).toEqual("2000000000000000000");
      expect(unbondedStake.getExp()).toEqual(18);
      expect(unbondedStake.getTicker()).toEqual("ETH");

      const totalDelegation = balance.totalDelegation();
      expect(totalDelegation.getAmount()).toEqual("1");
      expect(totalDelegation.getRawNumeric()).toEqual("1000000000000000000");
      expect(totalDelegation.getExp()).toEqual(18);
      expect(totalDelegation.getTicker()).toEqual("ETH");

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
          bonded_stake: bondedStake,
          unbonded_stake: unbondedStake,
          total_delegation_received: totalDelegation,
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
          bonded_stake: bondedStake,
          unbonded_stake: unbondedStake,
          total_delegation_received: totalDelegation,
          participate_type: "validator",
        },
        asset,
      );

      const balanceStr = balance.toString();
      expect(balanceStr).toEqual(
        `StakingBalance { date: '2024-05-03T00:00:00.000Z' address: '${address.getId()}' bondedStake: '{ amount: '${bondedStake.getAmount()}', raw_numeric: '${bondedStake.getRawNumeric()}', exp: ${bondedStake.getExp()}, ticker: '${bondedStake.getTicker()}' }' unbondedStake: '{ amount: '${unbondedStake.getAmount()}', raw_numeric: '${unbondedStake.getRawNumeric()}', exp: ${unbondedStake.getExp()}, ticker: '${unbondedStake.getTicker()}' }' totalDelegation: '{ amount: '${totalDelegation.getAmount()}', raw_numeric: '${totalDelegation.getRawNumeric()}', exp: ${totalDelegation.getExp()}, ticker: '${totalDelegation.getTicker()}' }' participateType: 'validator' }`,
      );
    });
  });

  describe(".addressId", () => {
    it("should return the onchain address of the StakingBalance", () => {
      const balance = new StakingBalance(
        {
          address_id: address.getId(),
          date: "2024-05-03",
          bonded_stake: bondedStake,
          unbonded_stake: unbondedStake,
          total_delegation_received: totalDelegation,
          participate_type: "validator",
        },
        asset,
      );

      const addressId = balance.addressId();
      expect(addressId).toEqual(address.getId());
    });
  });
});

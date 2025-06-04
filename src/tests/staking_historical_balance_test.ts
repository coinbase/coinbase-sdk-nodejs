import { FetchHistoricalStakingBalances200Response } from "../client";
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

describe("StakingBalance", () => {
  const startTime = "2024-05-01T00:00:00Z";
  const endTime = "2024-05-21T00:00:00Z";
  const newAddress = newAddressModel("", "some-address-id", Coinbase.networks.EthereumHoodi);
  const address = new ExternalAddress(newAddress.network_id, newAddress.address_id);
  const asset = {
    asset_id: Coinbase.assets.Eth,
    network_id: address.getNetworkId(),
    decimals: 18,
  };

  const bondedStake = {
    amount: "32000000000000000000",
    asset: asset,
  };
  const unbondedBalance = {
    amount: "2000000000000000000",
    asset: asset,
  };

  const HISTORICAL_STAKING_BALANCES_RESPONSE: FetchHistoricalStakingBalances200Response = {
    data: [
      {
        address: address.getId(),
        date: "2024-05-01",
        bonded_stake: bondedStake,
        unbonded_balance: unbondedBalance,
        participant_type: "validator",
      },
      {
        address: address.getId(),
        date: "2024-05-02",
        bonded_stake: bondedStake,
        unbonded_balance: unbondedBalance,
        participant_type: "validator",
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

  describe("#list", () => {
    it("should successfully return staking balances", async () => {
      Coinbase.apiClients.stake!.fetchHistoricalStakingBalances = mockReturnValue(
        HISTORICAL_STAKING_BALANCES_RESPONSE,
      );
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
      expect(Coinbase.apiClients.stake!.fetchHistoricalStakingBalances).toHaveBeenCalledWith(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        address.getId(),
        startTime,
        endTime,
        100,
        undefined,
      );
    });
    it("should successfully return staking balances for multiple pages", async () => {
      const pages = ["abc", "def"];
      Coinbase.apiClients.stake!.fetchHistoricalStakingBalances = mockFn(() => {
        HISTORICAL_STAKING_BALANCES_RESPONSE.next_page = pages.shift() as string;
        HISTORICAL_STAKING_BALANCES_RESPONSE.has_more =
          !!HISTORICAL_STAKING_BALANCES_RESPONSE.next_page;
        return { data: HISTORICAL_STAKING_BALANCES_RESPONSE };
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
      expect(Coinbase.apiClients.stake!.fetchHistoricalStakingBalances).toHaveBeenCalledWith(
        address.getNetworkId(),
        Coinbase.assets.Eth,
        address.getId(),
        startTime,
        endTime,
        100,
        undefined,
      );
    });
  });

  describe(".date", () => {
    it("should return the correct date", () => {
      const balance = new StakingBalance({
        address: address.getId(),
        date: "2024-05-03",
        bonded_stake: bondedStake,
        unbonded_balance: unbondedBalance,
        participant_type: "validator",
      });

      const date = balance.date();
      expect(date).toEqual(new Date("2024-05-03"));
    });
  });

  describe(".toString", () => {
    it("should return the string representation of a staking balance", () => {
      const balance = new StakingBalance({
        address: address.getId(),
        date: "2024-05-03",
        bonded_stake: bondedStake,
        unbonded_balance: unbondedBalance,
        participant_type: "validator",
      });

      const balanceStr = balance.toString();
      expect(balanceStr).toEqual(
        "StakingBalance { date: '2024-05-03T00:00:00.000Z' address: 'some-address-id' bondedStake: '32 ETH' unbondedBalance: '2 ETH' participantType: 'validator' }",
      );
    });
  });

  describe(".addressId", () => {
    it("should return the onchain address of the StakingBalance", () => {
      const balance = new StakingBalance({
        address: address.getId(),
        date: "2024-05-03",
        bonded_stake: bondedStake,
        unbonded_balance: unbondedBalance,
        participant_type: "validator",
      });

      const addressId = balance.address();
      expect(addressId).toEqual(address.getId());
    });
  });
});

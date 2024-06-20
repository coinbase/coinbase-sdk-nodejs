import { Coinbase } from "../coinbase";
import {
  assetsApiMock,
  getAssetMock,
  mockReturnValue,
  stakeApiMock,
  VALID_ADDRESS_MODEL,
} from "./utils";
import {
  StakingContext as StakingContextModel,
  StakingOperation as StakingOperationModel,
} from "../client";
import Decimal from "decimal.js";
import { ExternalAddress } from "../coinbase/address/external_address";
import { StakeOptionsMode } from "../coinbase/types";
import { StakingOperation } from "../coinbase/staking_operation";

describe("DeveloperAddress", () => {
  const address = new ExternalAddress(
    VALID_ADDRESS_MODEL.network_id,
    VALID_ADDRESS_MODEL.address_id,
  );
  const STAKING_CONTEXT_MODEL: StakingContextModel = {
    context: {
      stakeable_balance: "3000000000000000000",
      unstakeable_balance: "2000000000000000000",
      claimable_balance: "1000000000000000000",
    },
  };
  const STAKING_OPERATION_MODEL: StakingOperationModel = {
    transaction: {
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
  };

  beforeAll(() => {
    Coinbase.apiClients.stake = stakeApiMock;
    Coinbase.apiClients.asset = assetsApiMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(".buildStakeOperation", () => {
    it("should successfully build a stake operation", async () => {
      Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
      Coinbase.apiClients.stake!.buildStakingOperation = mockReturnValue(STAKING_OPERATION_MODEL);
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const op = await address.buildStakeOperation(new Decimal("0.0001"), Coinbase.assets.Eth);

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
        action: "stake",
        options: {
          mode: StakeOptionsMode.DEFAULT,
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
  });
});

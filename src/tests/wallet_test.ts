import * as fs from "fs";
import crypto, { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { ethers } from "ethers";
import { APIError } from "../coinbase/api_error";
import { Coinbase } from "../coinbase/coinbase";
import { ArgumentError } from "../coinbase/errors";
import { Wallet } from "../coinbase/wallet";
import { Transfer } from "../coinbase/transfer";
import { ServerSignerStatus, StakeOptionsMode, TransferStatus } from "../coinbase/types";
import {
  AddressBalanceList,
  AddressHistoricalBalanceList,
  Address as AddressModel,
  Balance as BalanceModel,
  TransactionStatusEnum,
  Wallet as WalletModel,
  Trade as TradeModel,
  StakingOperation as StakingOperationModel,
  StakingOperationStatusEnum,
  StakingContext as StakingContextModel,
  FetchStakingRewards200Response,
  FetchHistoricalStakingBalances200Response,
  StakingRewardStateEnum,
  StakingRewardFormat,
  FeatureSet,
} from "./../client";
import {
  VALID_ADDRESS_MODEL,
  VALID_TRANSFER_MODEL,
  VALID_WALLET_MODEL,
  addressesApiMock,
  assetsApiMock,
  generateWalletFromSeed,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  tradeApiMock,
  transfersApiMock,
  walletsApiMock,
  mockListAddress,
  getAssetMock,
  externalAddressApiMock,
  balanceHistoryApiMock,
  stakeApiMock,
  walletStakeApiMock,
  MINT_NFT_ABI,
  MINT_NFT_ARGS,
  VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL,
  VALID_SIGNED_CONTRACT_INVOCATION_MODEL,
} from "./utils";
import { Trade } from "../coinbase/trade";
import { WalletAddress } from "../coinbase/address/wallet_address";
import { StakingOperation } from "../coinbase/staking_operation";
import { StakingReward } from "../coinbase/staking_reward";
import { StakingBalance } from "../coinbase/staking_balance";
import { PayloadSignature } from "../coinbase/payload_signature";
import { ContractInvocation } from "../coinbase/contract_invocation";

describe("Wallet Class", () => {
  let wallet: Wallet;
  let walletModel: WalletModel;
  let walletId: string;
  const apiResponses = {};
  const existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

  beforeAll(async () => {
    const { address1 } = generateWalletFromSeed(existingSeed, 1);
    jest.spyOn(ethers.Wallet, "createRandom").mockReturnValue({
      privateKey: `0x${existingSeed}`,
    } as never);
    walletId = crypto.randomUUID();
    // Mock the API calls
    Coinbase.apiClients.wallet = walletsApiMock;
    Coinbase.apiClients.address = addressesApiMock;
    Coinbase.apiClients.wallet!.createWallet = mockFn(request => {
      const { network_id } = request.wallet;
      apiResponses[walletId] = {
        id: walletId,
        network_id,
        default_address: newAddressModel(walletId),
      };
      return { data: apiResponses[walletId] };
    });
    Coinbase.apiClients.wallet!.getWallet = mockFn(walletId => {
      walletModel = apiResponses[walletId];
      walletModel.default_address!.address_id = address1;
      return { data: apiResponses[walletId] };
    });
    Coinbase.apiClients.address!.createAddress = mockFn(walletId => {
      return { data: apiResponses[walletId].default_address };
    });
    wallet = await Wallet.create();
  });

  beforeEach(async () => {
    Coinbase.useServerSigner = false;
  });

  describe("#stakingOperation", () => {
    let walletModel: WalletModel;
    const addressID = "0xdeadbeef";
    const STAKING_OPERATION_MODEL: StakingOperationModel = {
      id: randomUUID(),
      network_id: Coinbase.networks.EthereumHolesky,
      address_id: addressID,
      status: StakingOperationStatusEnum.Complete,
      transactions: [
        {
          from_address_id: addressID,
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
          address_id: addressID,
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
          address_id: addressID,
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
          address_id: addressID,
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
          address: addressID,
          date: "2024-05-01",
          bonded_stake: {
            amount: "32000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 18,
            },
          },
          unbonded_balance: {
            amount: "2000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 18,
            },
          },
          participant_type: "validator",
        },
        {
          address: addressID,
          date: "2024-05-02",
          bonded_stake: {
            amount: "32000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 18,
            },
          },
          unbonded_balance: {
            amount: "2000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.EthereumHolesky,
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
      Coinbase.apiClients.stake = stakeApiMock;
      Coinbase.apiClients.walletStake = walletStakeApiMock;
      Coinbase.apiClients.asset = assetsApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe(".createStake", () => {
      it("should create a staking operation from the default address", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        STAKING_OPERATION_MODEL.wallet_id = wallet.getId();
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await wallet.createStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });

      it("should throw an error when wait is called on wallet address based staking operation", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        const op = await wallet.createStake(0.001, Coinbase.assets.Eth);
        expect(op).toBeInstanceOf(StakingOperation);
        await expect(async () => await op.wait()).rejects.toThrow(Error);
      });

      it("should fail when reloading without a wallet id", async () => {
        const stakingOperation = new StakingOperation(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.wallet_id = undefined;
        await expect(async () => await stakingOperation.reload()).rejects.toThrow(Error);
      });
    });

    describe(".createUnstake", () => {
      it("should create a staking operation from the default address", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        STAKING_OPERATION_MODEL.wallet_id = wallet.getId();
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await wallet.createUnstake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe(".createClaimStake", () => {
      it("should create a staking operation from the default address", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        STAKING_OPERATION_MODEL.wallet_id = wallet.getId();
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        Coinbase.apiClients.walletStake!.createStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        Coinbase.apiClients.walletStake!.broadcastStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);
        STAKING_OPERATION_MODEL.status = StakingOperationStatusEnum.Complete;
        Coinbase.apiClients.walletStake!.getStakingOperation =
          mockReturnValue(STAKING_OPERATION_MODEL);

        const op = await wallet.createClaimStake(0.001, Coinbase.assets.Eth);

        expect(op).toBeInstanceOf(StakingOperation);
      });
    });

    describe(".stakeableBalance", () => {
      it("should return the stakeable balance successfully with default params", async () => {
        //const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await wallet.stakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("3"));
      });
    });

    describe(".unstakeableBalance", () => {
      it("should return the unstakeableBalance balance successfully with default params", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await wallet.unstakeableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("2"));
      });
    });

    describe(".claimableBalance", () => {
      it("should return the claimableBalance balance successfully with default params", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        Coinbase.apiClients.stake!.getStakingContext = mockReturnValue(STAKING_CONTEXT_MODEL);
        const stakeableBalance = await wallet.claimableBalance(Coinbase.assets.Eth);
        expect(stakeableBalance).toEqual(new Decimal("1"));
      });
    });

    describe(".stakingRewards", () => {
      it("should successfully return staking rewards", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        Coinbase.apiClients.stake!.fetchStakingRewards = mockReturnValue(STAKING_REWARD_RESPONSE);
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        const response = await wallet.stakingRewards(Coinbase.assets.Eth);
        expect(response).toBeInstanceOf(Array<StakingReward>);
      });
    });

    describe(".historicalStakingBalances", () => {
      it("should successfully return historical staking balances", async () => {
        const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
        Coinbase.apiClients.stake!.fetchHistoricalStakingBalances = mockReturnValue(
          HISTORICAL_STAKING_BALANCES_RESPONSE,
        );
        Coinbase.apiClients.asset!.getAsset = getAssetMock();
        const response = await wallet.historicalStakingBalances(Coinbase.assets.Eth);
        expect(response).toBeInstanceOf(Array<StakingBalance>);
        expect(response.length).toEqual(2);
        expect(response[0].bondedStake().amount).toEqual(new Decimal("32"));
        expect(response[0].bondedStake().asset?.assetId).toEqual("eth");
        expect(response[0].bondedStake().asset?.decimals).toEqual(18);
        expect(response[0].bondedStake().asset?.networkId).toEqual(
          Coinbase.networks.EthereumHolesky,
        );
        expect(response[0].unbondedBalance().amount).toEqual(new Decimal("2"));
        expect(response[0].unbondedBalance().asset?.assetId).toEqual("eth");
        expect(response[0].unbondedBalance().asset?.decimals).toEqual(18);
        expect(response[0].unbondedBalance().asset?.networkId).toEqual(
          Coinbase.networks.EthereumHolesky,
        );
      });
    });
  });

  describe(".listHistoricalBalances", () => {
    beforeEach(() => {
      const mockHistoricalBalanceResponse: AddressHistoricalBalanceList = {
        data: [
          {
            amount: "1000000",
            block_hash: "0x0dadd465fb063ceb78babbb30abbc6bfc0730d0c57a53e8f6dc778dafcea568f",
            block_height: "12345",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.EthereumHolesky,
              decimals: 6,
            },
          },
          {
            amount: "5000000",
            block_hash: "0x5c05a37dcb4910b22a775fc9480f8422d9d615ad7a6a0aa9d8778ff8cc300986",
            block_height: "67890",
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
      Coinbase.apiClients.balanceHistory = balanceHistoryApiMock;
      Coinbase.apiClients.balanceHistory!.listAddressHistoricalBalance = mockReturnValue(
        mockHistoricalBalanceResponse,
      );
    });

    it("should successfully return historical balances", async () => {
      const wallet = await Wallet.create({ networkId: Coinbase.networks.EthereumHolesky });
      Coinbase.apiClients.asset!.getAsset = getAssetMock();
      const response = await wallet.listHistoricalBalances({
        assetId: Coinbase.assets.Usdc,
      });
      expect(response.historicalBalances.length).toEqual(2);
      expect(response.historicalBalances[0].amount).toEqual(new Decimal(1));
      expect(response.historicalBalances[1].amount).toEqual(new Decimal(5));
      expect(response.nextPageToken).toEqual("");
    });
  });

  describe(".createTransfer", () => {
    let weiAmount, destination;
    let balanceModel: BalanceModel;

    beforeEach(() => {
      jest.clearAllMocks();
      const key = ethers.Wallet.createRandom();
      weiAmount = new Decimal("5");
      destination = new WalletAddress(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);
      Coinbase.apiClients.externalAddress = externalAddressApiMock;
      Coinbase.apiClients.asset = assetsApiMock;
      Coinbase.apiClients.asset!.getAsset = getAssetMock();

      Coinbase.apiClients.externalAddress.getExternalAddressBalance = mockFn(request => {
        const { asset_id } = request;
        balanceModel = {
          amount: "5000000000000000000",
          asset: {
            network_id: Coinbase.networks.BaseSepolia,
            asset_id,
            decimals: 18,
            contract_address: "0x",
          },
        };
        return { data: balanceModel };
      });

      Coinbase.apiClients.transfer = transfersApiMock;
    });

    it("should successfully create a transfer", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        transaction_hash: "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11",
        ...VALID_TRANSFER_MODEL,
      });

      const transfer = await wallet.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);

      expect(transfer).toBeInstanceOf(Transfer);
      expect(transfer.getId()).toBe(VALID_TRANSFER_MODEL.transfer_id);
    });

    // TODO: Returns the transfer.

    it("should throw an APIError if the createTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnRejectedValue(
        new APIError("Failed to create transfer"),
      );
      await expect(
        wallet.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(APIError);
    });

    it("should throw an APIError if the broadcastTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      await expect(
        wallet.createTransfer({
          amount: weiAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(APIError);
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        wallet.createTransfer({
          amount: insufficientAmount,
          assetId: Coinbase.assets.Wei,
          destination,
        }),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);

      const transfer = await wallet.createTransfer({
        amount: weiAmount,
        assetId: Coinbase.assets.Wei,
        destination,
      });

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);

      expect(transfer).toBeInstanceOf(Transfer);
      expect(transfer.getId()).toBe(VALID_TRANSFER_MODEL.transfer_id);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe("#invokeContract", () => {
    let expectedInvocation;
    let options = {
      abi: MINT_NFT_ABI,
      args: MINT_NFT_ARGS,
      method: VALID_SIGNED_CONTRACT_INVOCATION_MODEL.method,
      contractAddress: VALID_SIGNED_CONTRACT_INVOCATION_MODEL.contract_address,
    };

    beforeEach(async () => {
      expectedInvocation = ContractInvocation.fromModel(VALID_SIGNED_CONTRACT_INVOCATION_MODEL);

      (await wallet.getDefaultAddress()).invokeContract = jest
        .fn()
        .mockResolvedValue(expectedInvocation);
    });

    it("successfully invokes a contract on the default address", async () => {
      const contractInvocation = await wallet.invokeContract(options);

      expect((await wallet.getDefaultAddress()).invokeContract).toHaveBeenCalledTimes(1);
      expect((await wallet.getDefaultAddress()).invokeContract).toHaveBeenCalledWith(options);

      expect(contractInvocation).toBeInstanceOf(ContractInvocation);
      expect(contractInvocation).toEqual(expectedInvocation);
    });
  });

  describe("#createPayloadSignature", () => {
    let unsignedPayload = VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL.unsigned_payload;
    let signature =
      "0xa4e14b28d86dfd7bae739d724ba2ffb13b4458d040930b805eea0a4bc2f5251e7901110677d1ef2ec23ef810c755d0bc72cc6472a4cfb3c53ef242c6ba9fa60a1b";

    beforeAll(() => {
      Coinbase.apiClients.address = addressesApiMock;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully create a payload signature", async () => {
      Coinbase.apiClients.address!.createPayloadSignature = mockReturnValue(
        VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL,
      );

      const payloadSignature = await wallet.createPayloadSignature(unsignedPayload);

      expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
        wallet.getId(),
        (await wallet.getDefaultAddress()).getId(),
        {
          unsigned_payload: unsignedPayload,
          signature,
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
        await wallet.createPayloadSignature(unsignedPayload);
      }).rejects.toThrow(Error);

      expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledWith(
        wallet.getId(),
        (await wallet.getDefaultAddress()).getId(),
        {
          unsigned_payload: unsignedPayload,
          signature,
        },
      );
      expect(Coinbase.apiClients.address!.createPayloadSignature).toHaveBeenCalledTimes(1);
    });
  });

  describe(".create", () => {
    beforeEach(() => {});
    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
    });

    describe("#getId", () => {
      it("should return the correct wallet ID", async () => {
        expect(wallet.getId()).toBe(walletModel.id);
      });
    });

    describe("#getNetworkId", () => {
      let wallet;
      let network_id;
      let createWalletParams;

      beforeEach(async () => {
        Coinbase.apiClients.wallet = walletsApiMock;
        Coinbase.apiClients.address = addressesApiMock;
        Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          network_id,
          server_signer_status: ServerSignerStatus.PENDING,
        });
        Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          network_id,
          server_signer_status: ServerSignerStatus.ACTIVE,
        });
        Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));

        wallet = await Wallet.create(createWalletParams);
      });

      describe("when a network is specified", () => {
        beforeAll(() => {
          network_id = Coinbase.networks.BaseMainnet;
          createWalletParams = { networkId: network_id };
        });

        it("it creates a wallet scoped to the specified network", () => {
          expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseMainnet);
        });
      });

      describe("when no network is specified", () => {
        beforeAll(() => {
          network_id = Coinbase.networks.BaseSepolia;
          createWalletParams = {};
        });

        it("it creates a wallet scoped to the default network", () => {
          expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseSepolia);
        });
      });
    });

    describe("#getDefaultAddress", () => {
      it("should return the correct default address", async () => {
        expect((await wallet.getDefaultAddress()).getId()).toBe(
          walletModel.default_address!.address_id,
        );
      });
    });

    it("should return true for canSign when the wallet is initialized without a seed", async () => {
      expect(wallet.canSign()).toBe(true);
    });

    it("should throw Error if derived key is not valid", async () => {
      Coinbase.apiClients.address!.listAddresses = mockFn(() => {
        return {
          data: {
            data: [VALID_ADDRESS_MODEL],
            has_more: false,
            next_page: "",
            total_count: 1,
          },
        };
      });
      await expect(wallet.listAddresses()).rejects.toThrow(Error);
    });

    it("should create new address and update the existing address list", async () => {
      const [addressList0] = mockListAddress(existingSeed, 1);
      let addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(1);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(addressList0);
      const newAddress = await wallet.createAddress();
      expect(newAddress).toBeInstanceOf(WalletAddress);
      mockListAddress(existingSeed, 2);
      addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(2);
      expect((await wallet.getAddress(newAddress.getId()))!.getId()).toBe(newAddress.getId());
      expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
    });

    describe("when using a server signer", () => {
      const walletId = crypto.randomUUID();
      let wallet: Wallet;
      beforeEach(async () => {
        jest.clearAllMocks();
        Coinbase.useServerSigner = true;
      });

      it("should return a Wallet instance", async () => {
        Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.PENDING,
        });
        Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.ACTIVE,
        });
        Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));

        wallet = await Wallet.create();
        expect(wallet).toBeInstanceOf(Wallet);
        expect(wallet.getServerSignerStatus()).toBe(ServerSignerStatus.ACTIVE);
        expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
        expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(2);
        expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
      });

      it("should throw an Error if the Wallet times out waiting on a not active server signer", async () => {
        const intervalSeconds = 0.000002;
        const timeoutSeconds = 0.000002;
        Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
          ...VALID_WALLET_MODEL,
          server_signer_status: ServerSignerStatus.PENDING,
        });

        await expect(Wallet.create({ timeoutSeconds, intervalSeconds })).rejects.toThrow(
          "Wallet creation timed out. Check status of your Server-Signer",
        );
        expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
        expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalled();
      });
    });
  });

  describe(".init", () => {
    let wallet: Wallet;
    let addressList: AddressModel[];
    let walletModel: WalletModel;
    const existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    const { address1, address2, address3, wallet1PrivateKey, wallet2PrivateKey } =
      generateWalletFromSeed(existingSeed, 3);

    beforeEach(async () => {
      jest.clearAllMocks();
      addressList = [
        {
          address_id: address1,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet1PrivateKey,
          wallet_id: walletId,
          index: 0,
        },
        {
          address_id: address2,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet2PrivateKey,
          wallet_id: walletId,
          index: 1,
        },
      ];
      walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressList[0],
        feature_set: {} as FeatureSet,
      };
      wallet = Wallet.init(walletModel, existingSeed);
      Coinbase.apiClients.address!.createAddress = mockFn(walletId => {
        return {
          data: {
            id: walletId,
            network_id: Coinbase.networks.BaseSepolia,
            default_address: newAddressModel(walletId),
          },
        };
      });
      Coinbase.apiClients.address!.listAddresses = mockFn(() => {
        return {
          data: {
            data: addressList,
          },
        };
      });
    });

    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should return the correct wallet ID", async () => {
      expect(wallet.getId()).toBe(walletModel.id);
    });

    it("should return the correct network ID", async () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseSepolia);
    });

    it("should derive the correct number of addresses", async () => {
      const addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(2);
    });

    it("should create new address and update the existing address list", async () => {
      mockListAddress(existingSeed, 2);
      let addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(2);
      const [, , lastAddress] = mockListAddress(existingSeed, 3);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(lastAddress);
      const newAddress = await wallet.createAddress();
      expect(newAddress).toBeInstanceOf(WalletAddress);
      addresses = await wallet.listAddresses();
      expect(addresses.length).toBe(3);
      expect((await wallet.getAddress(newAddress.getId()))!.getId()).toBe(newAddress.getId());
    });

    it("should return the correct string representation", async () => {
      expect(wallet.toString()).toBe(
        `Wallet{id: '${walletModel.id}', networkId: '${Coinbase.networks.BaseSepolia}'}`,
      );
    });

    it("should raise an error when the seed is invalid", async () => {
      const newWallet = Wallet.init(walletModel, "");
      expect(() => newWallet.setSeed(``)).toThrow(ArgumentError);
      expect(() => newWallet.setSeed(`invalid-seed`)).toThrow(ArgumentError);
    });

    it("should raise an error when creating a wallet with an invalid network", async () => {
      const newWallet = Wallet.init(
        {
          ...walletModel,
          network_id: "invalid_network_id",
        },
        "",
      );
      newWallet.setSeed(existingSeed);
      await expect(newWallet.createAddress()).rejects.toThrow(
        "Unsupported network ID: invalid_network_id",
      );
    });
  });

  describe("#export", () => {
    let walletId: string;
    let addressModel: AddressModel;
    let walletModel: WalletModel;
    let seedWallet: Wallet;
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

    beforeAll(async () => {
      walletId = crypto.randomUUID();
      addressModel = newAddressModel(walletId);
      walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressModel,
        feature_set: {} as FeatureSet,
      };
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.getAddress = mockFn(() => {
        return { data: addressModel };
      });
      seedWallet = Wallet.init(walletModel, seed);
    });

    it("exports the Wallet data", () => {
      const walletData = seedWallet.export();
      expect(walletData.walletId).toBe(seedWallet.getId());
      expect(walletData.seed).toBe(seed);
    });

    it("allows for re-creation of a Wallet", async () => {
      const walletData = seedWallet.export();
      const newWallet = Wallet.init(walletModel, walletData.seed);
      expect(newWallet).toBeInstanceOf(Wallet);
    });

    it("throws an error when the Wallet is seedless", async () => {
      const seedlessWallet = Wallet.init(walletModel, "");
      expect(() => seedlessWallet.export()).toThrow(Error);
    });

    it("should return true for canSign when the wallet is initialized with a seed", () => {
      expect(wallet.canSign()).toBe(true);
    });

    it("should be able to be imported", async () => {
      const walletData = seedWallet.export();
      const importedWallet = await Wallet.import(walletData);
      expect(importedWallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.address!.listAddresses).toHaveBeenCalledTimes(1);
    });
    it("should throw an error when walletId is not provided", async () => {
      const walletData = seedWallet.export();
      walletData.walletId = "";
      await expect(async () => await Wallet.import(walletData)).rejects.toThrow(
        "Wallet ID must be provided",
      );
    });
  });

  describe("#listBalances", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const mockBalanceResponse: AddressBalanceList = {
        data: [
          {
            amount: "1000000000000000000",
            asset: {
              asset_id: Coinbase.assets.Eth,
              network_id: Coinbase.networks.BaseSepolia,
              decimals: 18,
            },
          },
          {
            amount: "5000000",
            asset: {
              asset_id: "usdc",
              network_id: Coinbase.networks.BaseSepolia,
              decimals: 6,
            },
          },
        ],
        has_more: false,
        next_page: "",
        total_count: 2,
      };
      Coinbase.apiClients.wallet!.listWalletBalances = mockReturnValue(mockBalanceResponse);
    });

    it("should return a hash with an ETH and USDC balance", async () => {
      mockListAddress(existingSeed, 3);
      const balanceMap = await wallet.listBalances();
      expect(balanceMap.get("eth")).toEqual(new Decimal(1));
      expect(balanceMap.get("usdc")).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledWith(wallet.getId());
    });
  });

  describe("#getBalance", () => {
    beforeEach(() => {
      const mockWalletBalance: BalanceModel = {
        amount: "5000000000000000000",
        asset: {
          asset_id: Coinbase.assets.Eth,
          network_id: Coinbase.networks.BaseSepolia,
          decimals: 18,
        },
      };
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue(mockWalletBalance);
    });

    it("should return the correct ETH balance", async () => {
      const balanceMap = await wallet.getBalance(Coinbase.assets.Eth);
      expect(balanceMap).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        wallet.getId(),
        Coinbase.assets.Eth,
      );
    });

    it("should return the correct GWEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assets.Gwei);
      expect(balance).toEqual(new Decimal(5000000000));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        wallet.getId(),
        Coinbase.assets.Eth,
      );
    });

    it("should return the correct WEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(new Decimal(5000000000000000000));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        wallet.getId(),
        Coinbase.assets.Eth,
      );
    });

    it("should return 0 when the balance is not found", async () => {
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue({});
      const balance = await wallet.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(new Decimal(0));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        wallet.getId(),
        Coinbase.assets.Eth,
      );
    });
  });

  describe("#canSign", () => {
    let wallet;
    beforeAll(async () => {
      const mockAddressModel = newAddressModel(walletId);
      const mockWalletModel = {
        id: walletId,
        default_address: mockAddressModel,
        network_id: Coinbase.networks.BaseSepolia,
      };
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue(mockWalletModel);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(mockAddressModel);
      wallet = await Wallet.create();
    });
    it("should return true when the wallet initialized", () => {
      expect(wallet.canSign()).toBe(true);
    });
  });

  describe("should change the network ID", () => {
    let wallet;
    beforeAll(async () => {
      Coinbase.apiClients.wallet = walletsApiMock;
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.wallet!.createWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
        server_signer_status: ServerSignerStatus.PENDING,
      });
      Coinbase.apiClients.wallet!.getWallet = mockReturnValue({
        ...VALID_WALLET_MODEL,
        network_id: Coinbase.networks.BaseMainnet,
        server_signer_status: ServerSignerStatus.ACTIVE,
      });
      Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));
      wallet = await Wallet.create({
        networkId: Coinbase.networks.BaseMainnet,
      });
    });
    it("should return true when the wallet initialized", () => {
      expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseMainnet);
    });
  });

  describe("#saveSeed", () => {
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    let apiPrivateKey;
    const filePath = "seeds.json";
    let seedWallet;

    beforeEach(async () => {
      apiPrivateKey = Coinbase.apiKeyPrivateKey;
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;
      fs.writeFileSync(filePath, JSON.stringify({}), "utf8");
      seedWallet = Wallet.init(walletModel, seed);
    });

    afterEach(async () => {
      fs.unlinkSync(filePath);
      Coinbase.apiKeyPrivateKey = apiPrivateKey;
    });

    it("should save the seed when encryption is false", async () => {
      seedWallet.saveSeed(filePath, false);
      const storedSeedData = fs.readFileSync(filePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(false);
      expect(walletSeedData[walletId].iv).toBe("");
      expect(walletSeedData[walletId].authTag).toBe("");
      expect(walletSeedData[walletId].seed).toBe(seed);
    });

    it("should save the seed when encryption is true", async () => {
      seedWallet.saveSeed(filePath, true);
      const storedSeedData = fs.readFileSync(filePath);
      const walletSeedData = JSON.parse(storedSeedData.toString());
      expect(walletSeedData[walletId].encrypted).toBe(true);
      expect(walletSeedData[walletId].iv).not.toBe("");
      expect(walletSeedData[walletId].authTag).not.toBe("");
      expect(walletSeedData[walletId].seed).not.toBe(seed);
    });

    it("should throw an error when the wallet is seedless", async () => {
      const seedlessWallet = Wallet.init(walletModel, "");
      expect(() => seedlessWallet.saveSeed(filePath, false)).toThrow(Error);
    });
  });

  describe("#loadSeed", () => {
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    let apiPrivateKey;
    const filePath = "seeds.json";
    let seedWallet;
    let seedlessWallet;

    beforeEach(async () => {
      apiPrivateKey = Coinbase.apiKeyPrivateKey;
      Coinbase.apiKeyPrivateKey = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      }).privateKey;

      const initialSeedData = {
        [walletId]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(initialSeedData), "utf8");
      seedWallet = Wallet.init(walletModel, seed);
      seedlessWallet = Wallet.init(walletModel, "");
    });

    afterEach(async () => {
      fs.unlinkSync(filePath);
      Coinbase.apiKeyPrivateKey = apiPrivateKey;
    });

    it("loads the seed from the file", async () => {
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file", async () => {
      seedWallet.saveSeed(filePath, true);
      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file with multiple seeds", async () => {
      seedWallet.saveSeed(filePath, true);

      const otherModel = {
        id: crypto.randomUUID(),
        network_id: Coinbase.networks.BaseSepolia,
        feature_set: {} as FeatureSet,
      };
      const randomSeed = ethers.Wallet.createRandom().privateKey.slice(2);
      const otherWallet = Wallet.init(otherModel, randomSeed);
      otherWallet.saveSeed(filePath, true);

      await seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("raises an error if the wallet is already hydrated", async () => {
      await expect(seedWallet.loadSeed(filePath)).rejects.toThrow(Error);
    });

    it("raises an error when file contains different wallet data", async () => {
      const otherSeedData = {
        [crypto.randomUUID()]: {
          encrypted: false,
          iv: "",
          authTag: "",
          seed,
        },
      };
      fs.writeFileSync(filePath, JSON.stringify(otherSeedData), "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow(ArgumentError);
    });

    it("raises an error when the file is absent", async () => {
      await expect(seedlessWallet.loadSeed("non-file.json")).rejects.toThrow(ArgumentError);
    });

    it("raises an error when the file is corrupted", async () => {
      fs.writeFileSync(filePath, "corrupted data", "utf8");

      await expect(seedlessWallet.loadSeed(filePath)).rejects.toThrow(ArgumentError);
    });

    it("throws an error when the file is empty", async () => {
      fs.writeFileSync("invalid-file.json", "", "utf8");
      await expect(wallet.loadSeed("invalid-file.json")).rejects.toThrow(ArgumentError);
      fs.unlinkSync("invalid-file.json");
    });

    it("throws an error when the file is not a valid JSON", async () => {
      fs.writeFileSync("invalid-file.json", `{"test":{"authTag":false}}`, "utf8");
      await expect(wallet.loadSeed("invalid-file.json")).rejects.toThrow(ArgumentError);
      fs.unlinkSync("invalid-file.json");
    });
  });

  describe("#createTrade", () => {
    const tradeObject = new Trade({
      network_id: Coinbase.networks.BaseSepolia,
      wallet_id: walletId,
      address_id: VALID_ADDRESS_MODEL.address_id,
      trade_id: crypto.randomUUID(),
      from_amount: "0.01",
      transaction: {
        network_id: Coinbase.networks.BaseSepolia,
        from_address_id: VALID_ADDRESS_MODEL.address_id,
        unsigned_payload: "unsigned_payload",
        status: TransactionStatusEnum.Pending,
      },
    } as TradeModel);

    it("should create a trade from the default address", async () => {
      const trade = Promise.resolve(tradeObject);
      jest.spyOn(Wallet.prototype, "createTrade").mockReturnValue(trade);
      const wallet = await Wallet.create();
      const result = await wallet.createTrade({
        amount: 0.01,
        fromAssetId: "eth",
        toAssetId: "usdc",
      });
      expect(result).toBeInstanceOf(Trade);
      expect(result.getAddressId()).toBe(tradeObject.getAddressId());
      expect(result.getWalletId()).toBe(tradeObject.getWalletId());
      expect(result.getId()).toBe(tradeObject.getId());
    });

    it("should list trades for a given address", async () => {
      Coinbase.apiClients.trade = tradeApiMock;
      const listOfTrades = [tradeObject, tradeObject];
      Coinbase.apiClients.trade!.listTrades = mockFn(() => {
        const object = listOfTrades.shift();
        return {
          data: {
            data: [object],
            has_more: listOfTrades.length > 0,
            next_page: listOfTrades.length > 0 ? "x" : "",
            total_count: listOfTrades.length,
          },
        };
      });

      const [address1] = await wallet.listAddresses();
      const tradeWallet = (await wallet.getAddress(address1.getId())) as WalletAddress;
      const trades = await tradeWallet.listTrades();
      expect(trades[0]).toBeInstanceOf(Trade);
      expect(trades.length).toBe(2);
    });
  });
});

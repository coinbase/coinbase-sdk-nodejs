import * as fs from "fs";
import crypto from "crypto";
import Decimal from "decimal.js";
import { ethers } from "ethers";
import { Address } from "../address";
import { APIError } from "../api_error";
import { Coinbase } from "../coinbase";
import { GWEI_PER_ETHER, WEI_PER_ETHER } from "../constants";
import { ArgumentError, InternalError } from "../errors";
import { Wallet } from "../wallet";
import { ServerSignerStatus, TransferStatus } from "../types";
import {
  AddressBalanceList,
  Address as AddressModel,
  Balance as BalanceModel,
  Wallet as WalletModel,
} from "./../../client";
import {
  VALID_ADDRESS_MODEL,
  VALID_TRANSFER_MODEL,
  VALID_WALLET_MODEL,
  addressesApiMock,
  generateWalletFromSeed,
  mockFn,
  mockReturnRejectedValue,
  mockReturnValue,
  newAddressModel,
  transfersApiMock,
  walletsApiMock,
} from "./utils";

describe("Wallet Class", () => {
  let wallet: Wallet;
  let walletModel: WalletModel;
  let walletId: string;
  const apiResponses = {};

  beforeAll(async () => {
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

  describe(".createTransfer", () => {
    let weiAmount, destination, intervalSeconds, timeoutSeconds;
    let balanceModel: BalanceModel;

    beforeEach(() => {
      const key = ethers.Wallet.createRandom();
      weiAmount = new Decimal("500000000000000000");
      destination = new Address(VALID_ADDRESS_MODEL, key as unknown as ethers.Wallet);
      intervalSeconds = 0.2;
      timeoutSeconds = 10;
      Coinbase.apiClients.address!.getAddressBalance = mockFn(request => {
        const { asset_id } = request;
        balanceModel = {
          amount: "1000000000000000000",
          asset: {
            asset_id,
            network_id: Coinbase.networks.BaseSepolia,
          },
        };
        return { data: balanceModel };
      });

      Coinbase.apiClients.transfer = transfersApiMock;
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

      await wallet.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.broadcastTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should throw an APIError if the createTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnRejectedValue(
        new APIError("Failed to create transfer"),
      );
      await expect(
        wallet.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(APIError);
    });

    it("should throw an APIError if the broadcastTransfer API call fails", async () => {
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      await expect(
        wallet.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
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
        wallet.createTransfer(
          weiAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow("Transfer timed out");
    });

    it("should throw an ArgumentError if there are insufficient funds", async () => {
      const insufficientAmount = new Decimal("10000000000000000000");
      await expect(
        wallet.createTransfer(
          insufficientAmount,
          Coinbase.assets.Wei,
          destination,
          intervalSeconds,
          timeoutSeconds,
        ),
      ).rejects.toThrow(ArgumentError);
    });

    it("should successfully create and complete a transfer when using server signer", async () => {
      Coinbase.useServerSigner = true;
      Coinbase.apiClients.transfer!.createTransfer = mockReturnValue(VALID_TRANSFER_MODEL);
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });

      await wallet.createTransfer(
        weiAmount,
        Coinbase.assets.Wei,
        destination,
        intervalSeconds,
        timeoutSeconds,
      );

      expect(Coinbase.apiClients.transfer!.createTransfer).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe(".create", () => {
    it("should return a Wallet instance", async () => {
      expect(wallet).toBeInstanceOf(Wallet);
      expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.createWallet).toHaveBeenCalledWith({
        wallet: { network_id: Coinbase.networks.BaseSepolia },
      });
      expect(Coinbase.apiClients.wallet!.getWallet).toHaveBeenCalledWith(walletId);
    });

    describe(".getId", () => {
      it("should return the correct wallet ID", async () => {
        expect(wallet.getId()).toBe(walletModel.id);
      });
    });

    describe("#getNetworkId", () => {
      let wallet;
      let network_id = Coinbase.networks.BaseMainnet;

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
        const createWalletParams =
          network_id === Coinbase.networks.BaseMainnet
            ? {
                networkId: network_id,
              }
            : undefined;
        wallet = await Wallet.create(createWalletParams);
      });

      describe("when a network is specified", () => {
        beforeAll(() => {
          network_id = Coinbase.networks.BaseMainnet;
        });
        it("it creates a wallet scoped to the specified network", () => {
          expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseMainnet);
        });
      });
      describe("when no network is specified", () => {
        beforeAll(() => {
          network_id = Coinbase.networks.BaseSepolia;
        });
        it("it creates a wallet scoped to the default network", () => {
          expect(wallet.getNetworkId()).toBe(Coinbase.networks.BaseSepolia);
        });
      });
    });

    describe(".getDefaultAddress", () => {
      it("should return the correct default address", async () => {
        expect(wallet.getDefaultAddress()!.getId()).toBe(walletModel.default_address!.address_id);
      });
    });

    it("should return true for canSign when the wallet is initialized without a seed", async () => {
      expect(wallet.canSign()).toBe(true);
    });

    it("should create new address and update the existing address list", async () => {
      expect(wallet.listAddresses().length).toBe(1);
      Coinbase.apiClients.address!.createAddress = mockReturnValue(newAddressModel(walletId));
      const newAddress = await wallet.createAddress();
      expect(newAddress).toBeInstanceOf(Address);
      expect(wallet.listAddresses().length).toBe(2);
      expect(wallet.getAddress(newAddress.getId())!.getId()).toBe(newAddress.getId());
      expect(Coinbase.apiClients.address!.createAddress).toHaveBeenCalledTimes(1);
    });

    describe("when using a server signer", () => {
      let walletId = crypto.randomUUID();
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

        await expect(Wallet.create({ intervalSeconds, timeoutSeconds })).rejects.toThrow(
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

    beforeEach(async () => {
      jest.clearAllMocks();
      const existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
      const { address1, address2, wallet1PrivateKey, wallet2PrivateKey } =
        generateWalletFromSeed(existingSeed);
      addressList = [
        {
          address_id: address1,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet1PrivateKey,
          wallet_id: walletId,
        },
        {
          address_id: address2,
          network_id: Coinbase.networks.BaseSepolia,
          public_key: wallet2PrivateKey,
          wallet_id: walletId,
        },
      ];
      walletModel = {
        id: walletId,
        network_id: Coinbase.networks.BaseSepolia,
        default_address: addressList[0],
        enabled_features: [],
      };
      wallet = await Wallet.init(walletModel, existingSeed, addressList);
      Coinbase.apiClients.address!.createAddress = mockFn(walletId => {
        return {
          data: {
            id: walletId,
            network_id: Coinbase.networks.BaseSepolia,
            default_address: newAddressModel(walletId),
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
      expect(wallet.listAddresses().length).toBe(2);
    });

    it("should create new address and update the existing address list", async () => {
      expect(wallet.listAddresses().length).toBe(2);
      const newAddress = await wallet.createAddress();
      expect(newAddress).toBeInstanceOf(Address);
      expect(wallet.listAddresses().length).toBe(3);
      expect(wallet.getAddress(newAddress.getId())!.getId()).toBe(newAddress.getId());
    });

    it("should return the correct string representation", async () => {
      expect(wallet.toString()).toBe(
        `Wallet{id: '${walletModel.id}', networkId: '${Coinbase.networks.BaseSepolia}'}`,
      );
    });
  });

  describe(".export", () => {
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
        enabled_features: [],
      };
      Coinbase.apiClients.address = addressesApiMock;
      Coinbase.apiClients.address!.getAddress = mockFn(() => {
        return { data: addressModel };
      });
      seedWallet = await Wallet.init(walletModel, seed);
    });

    it("exports the Wallet data", () => {
      const walletData = seedWallet.export();
      expect(walletData.walletId).toBe(seedWallet.getId());
      expect(walletData.seed).toBe(seed);
    });

    it("allows for re-creation of a Wallet", async () => {
      const walletData = seedWallet.export();
      const newWallet = await Wallet.init(walletModel, walletData.seed);
      expect(newWallet).toBeInstanceOf(Wallet);
    });

    it("should return true for canSign when the wallet is initialized with a seed", () => {
      expect(wallet.canSign()).toBe(true);
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
      const balanceMap = await wallet.listBalances();
      expect(balanceMap.get("eth")).toEqual(new Decimal(1));
      expect(balanceMap.get("usdc")).toEqual(new Decimal(5));
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.listWalletBalances).toHaveBeenCalledWith(walletId);
    });
  });

  describe(".getBalance", () => {
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
        walletId,
        Coinbase.assets.Eth,
      );
    });

    it("should return the correct GWEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assets.Gwei);
      expect(balance).toEqual(GWEI_PER_ETHER.mul(5));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assets.Gwei,
      );
    });

    it("should return the correct WEI balance", async () => {
      const balance = await wallet.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(WEI_PER_ETHER.mul(5));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assets.Wei,
      );
    });

    it("should return 0 when the balance is not found", async () => {
      Coinbase.apiClients.wallet!.getWalletBalance = mockReturnValue({});
      const balance = await wallet.getBalance(Coinbase.assets.Wei);
      expect(balance).toEqual(new Decimal(0));
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.wallet!.getWalletBalance).toHaveBeenCalledWith(
        walletId,
        Coinbase.assets.Wei,
      );
    });
  });

  describe(".canSign", () => {
    let wallet;
    beforeAll(async () => {
      const mockAddressModel = newAddressModel(walletId);
      const mockWalletModel = {
        id: walletId,
        default_address: mockAddressModel,
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

  describe(".saveSeed", () => {
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
      seedWallet = await Wallet.init(walletModel, seed);
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
      const seedlessWallet = await Wallet.init(walletModel, "", [newAddressModel(walletId)]);
      expect(() => seedlessWallet.saveSeed(filePath, false)).toThrow(InternalError);
    });
  });

  describe(".loadSeed", () => {
    const seed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    let apiPrivateKey;
    const filePath = "seeds.json";
    let seedWallet;
    let seedlessWallet;
    const addressModel = newAddressModel(walletId, "0x919538116b4F25f1CE01429fd9Ed7964556bf565");

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
      seedWallet = await Wallet.init(walletModel, seed, [addressModel]);
      seedlessWallet = await Wallet.init(walletModel, "", [addressModel]);
    });

    afterEach(async () => {
      fs.unlinkSync(filePath);
      Coinbase.apiKeyPrivateKey = apiPrivateKey;
    });

    it("loads the seed from the file", async () => {
      seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file", async () => {
      seedWallet.saveSeed(filePath, true);
      seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("loads the encrypted seed from the file with multiple seeds", async () => {
      seedWallet.saveSeed(filePath, true);

      const otherModel = {
        id: crypto.randomUUID(),
        network_id: Coinbase.networks.BaseSepolia,
        enabled_features: [],
      };
      const otherWallet = await Wallet.init(otherModel);
      otherWallet.saveSeed(filePath, true);

      seedlessWallet.loadSeed(filePath);
      expect(seedlessWallet.canSign()).toBe(true);
    });

    it("raises an error if the wallet is already hydrated", async () => {
      expect(() => seedWallet.loadSeed(filePath)).toThrow(InternalError);
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

      expect(() => seedlessWallet.loadSeed(filePath)).toThrow(ArgumentError);
    });

    it("raises an error when the file is absent", async () => {
      expect(() => seedlessWallet.loadSeed("non-file.json")).toThrow(ArgumentError);
    });

    it("raises an error when the file is corrupted", async () => {
      fs.writeFileSync(filePath, "corrupted data", "utf8");

      expect(() => seedlessWallet.loadSeed(filePath)).toThrow(ArgumentError);
    });
  });
});

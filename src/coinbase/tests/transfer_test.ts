import { ethers } from "ethers";
import { Transfer as TransferModel, TransferStatusEnum } from "../../client/api";
import { ApiClients, TransferStatus } from "../types";
import { Transfer } from "../transfer";
import { Coinbase } from "../coinbase";

const fromKey = ethers.Wallet.createRandom();

const networkId = "base_sepolia";
const walletId = "12345";
const fromAddressId = fromKey.address;
const amount = ethers.parseUnits("100", 18);
const ethAmount = amount / BigInt(Coinbase.WEI_PER_ETHER);
const toAddressId = "0x4D9E4F3f4D1A8B5F4f7b1F5b5C7b8d6b2B3b1b0b";
const transferId = "67890";

const unsignedPayload =
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

const signedPayload =
  "02f86b83014a3401830f4240830f4350825208946cd01c0f55ce9e0bf78f5e90f72b4345b" +
  "16d515d0280c001a0566afb8ab09129b3f5b666c3a1e4a7e92ae12bbee8c75b4c6e0c46f6" +
  "6dd10094a02115d1b52c49b39b6cb520077161c9bf636730b1b40e749250743f4524e9e4ba";

const transactionHash = "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11";

const mockProvider = new ethers.JsonRpcProvider(
  "https://sepolia.base.org",
) as jest.Mocked<ethers.JsonRpcProvider>;
mockProvider.getTransaction = jest.fn();
mockProvider.getTransactionReceipt = jest.fn();

describe("Transfer Class", () => {
  let transferModel: TransferModel;
  let mockApiClients: ApiClients;
  let transfer: Transfer;

  beforeEach(() => {
    transferModel = {
      transfer_id: transferId,
      network_id: networkId,
      wallet_id: walletId,
      address_id: fromAddressId,
      destination: toAddressId,
      asset_id: "eth",
      amount: amount.toString(),
      unsigned_payload: unsignedPayload,
      status: TransferStatusEnum.Pending,
    } as TransferModel;

    mockApiClients = { baseSepoliaProvider: mockProvider } as ApiClients;

    transfer = new Transfer(transferModel, mockApiClients);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize a new Transfer", () => {
      expect(transfer).toBeInstanceOf(Transfer);
    });
  });

  describe("getId", () => {
    it("should return the transfer ID", () => {
      expect(transfer.getId()).toEqual(transferId);
    });
  });

  describe("getNetworkId", () => {
    it("should return the network ID", () => {
      expect(transfer.getNetworkId()).toEqual(networkId);
    });
  });

  describe("getWalletId", () => {
    it("should return the wallet ID", () => {
      expect(transfer.getWalletId()).toEqual(walletId);
    });
  });

  describe("getFromAddressId", () => {
    it("should return the source address ID", () => {
      expect(transfer.getFromAddressId()).toEqual(fromAddressId);
    });
  });

  describe("getDestinationAddressId", () => {
    it("should return the destination address ID", () => {
      expect(transfer.getDestinationAddressId()).toEqual(toAddressId);
    });
  });

  describe("getAssetId", () => {
    it("should return the asset ID", () => {
      expect(transfer.getAssetId()).toEqual("eth");
    });
  });

  describe("getAmount", () => {
    it("should return the amount", () => {
      transferModel.asset_id = "usdc";
      transfer = new Transfer(transferModel, mockApiClients);
      expect(transfer.getAmount()).toEqual(amount);
    });

    it("should return the ETH amount when the asset ID is eth", () => {
      expect(transfer.getAmount()).toEqual(BigInt(ethAmount));
    });
  });

  describe("getUnsignedPayload", () => {
    it("should return the unsigned payload", () => {
      expect(transfer.getUnsignedPayload()).toEqual(unsignedPayload);
    });
  });

  describe("getSignedPayload", () => {
    it("should return undefined when the transfer has not been broadcast on chain", () => {
      expect(transfer.getSignedPayload()).toBeUndefined();
    });

    it("should return the signed payload when the transfer has been broadcast on chain", () => {
      transferModel.signed_payload = signedPayload;
      transfer = new Transfer(transferModel, mockApiClients);
      expect(transfer.getSignedPayload()).toEqual(signedPayload);
    });
  });

  describe("getTransactionHash", () => {
    it("should return undefined when the transfer has not been broadcast on chain", () => {
      expect(transfer.getTransactionHash()).toBeUndefined();
    });

    it("should return the transaction hash when the transfer has been broadcast on chain", () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      expect(transfer.getTransactionHash()).toEqual(transactionHash);
    });
  });

  describe("getTransaction", () => {
    it("should return the Transfer transaction", () => {
      const transaction = transfer.getTransaction();
      expect(transaction).toBeInstanceOf(ethers.Transaction);
      expect(transaction.chainId).toEqual(BigInt("0x14a34"));
      expect(transaction.nonce).toEqual(Number("0x0"));
      expect(transaction.maxPriorityFeePerGas).toEqual(BigInt("0x59682f00"));
      expect(transaction.maxFeePerGas).toEqual(BigInt("0x59682f00"));
      expect(transaction.gasLimit).toEqual(BigInt("0x5208"));
      expect(transaction.to).toEqual(toAddressId);
      expect(transaction.value).toEqual(amount);
      expect(transaction.data).toEqual("0x");
    });
  });

  describe("getStatus", () => {
    it("should return PENDING when the transaction has not been created", async () => {
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.PENDING);
    });

    it("should return PENDING when the transaction has been created but not broadcast", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce(null);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.PENDING);
    });

    it("should return BROADCAST when the transaction has been broadcast but not included in a block", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: null,
      } as ethers.TransactionResponse);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.BROADCAST);
    });

    it("should return COMPLETE when the transaction has confirmed", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 1,
      } as ethers.TransactionReceipt);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.COMPLETE);
    });

    it("should return FAILED when the transaction has failed", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 0,
      } as ethers.TransactionReceipt);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.FAILED);
    });
  });

  describe("wait", () => {
    it("should return the completed Transfer when the transfer is completed", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 1,
      } as ethers.TransactionReceipt);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 1,
      } as ethers.TransactionReceipt);

      const promise = transfer.wait(0.2, 10);

      const result = await promise;
      expect(result).toBe(transfer);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.COMPLETE);
    });

    it("should return the failed Transfer when the transfer is failed", async () => {
      transferModel.transaction_hash = transactionHash;
      transfer = new Transfer(transferModel, mockApiClients);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 0,
      } as ethers.TransactionReceipt);
      mockProvider.getTransaction.mockResolvedValueOnce({
        blockHash: "0xdeadbeef",
      } as ethers.TransactionResponse);
      mockProvider.getTransactionReceipt.mockResolvedValueOnce({
        status: 0,
      } as ethers.TransactionReceipt);

      const promise = transfer.wait(0.2, 10);

      const result = await promise;
      expect(result).toBe(transfer);
      const status = await transfer.getStatus();
      expect(status).toEqual(TransferStatus.FAILED);
    });

    it("should throw an error when the transfer times out", async () => {
      const promise = transfer.wait(0.2, 0.00001);

      await expect(promise).rejects.toThrow("Transfer timed out");
    });
  });
});

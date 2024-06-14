import { ethers } from "ethers";
import { Decimal } from "decimal.js";
import { Transfer as TransferModel } from "../client/api";
import { TransferStatus } from "../coinbase/types";
import { Transfer } from "../coinbase/transfer";
import { Coinbase } from "../coinbase";
import { WEI_PER_ETHER } from "../coinbase/constants";
import { VALID_TRANSFER_MODEL, mockReturnValue, transfersApiMock } from "./utils";

const amount = new Decimal(ethers.parseUnits("100", 18).toString());
const ethAmount = amount.div(WEI_PER_ETHER);
const signedPayload =
  "02f86b83014a3401830f4240830f4350825208946cd01c0f55ce9e0bf78f5e90f72b4345b" +
  "16d515d0280c001a0566afb8ab09129b3f5b666c3a1e4a7e92ae12bbee8c75b4c6e0c46f6" +
  "6dd10094a02115d1b52c49b39b6cb520077161c9bf636730b1b40e749250743f4524e9e4ba";

const transactionHash = "0x6c087c1676e8269dd81e0777244584d0cbfd39b6997b3477242a008fa9349e11";

describe("Transfer Class", () => {
  let transferModel: TransferModel;
  let transfer: Transfer;

  beforeEach(() => {
    Coinbase.apiClients.transfer = transfersApiMock;
    transferModel = VALID_TRANSFER_MODEL;
    transfer = Transfer.fromModel(transferModel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize a new Transfer", () => {
      expect(transfer).toBeInstanceOf(Transfer);
    });
    it("should raise an error when the transfer model is empty", () => {
      expect(() => Transfer.fromModel(undefined!)).toThrow("Transfer model cannot be empty");
    });
  });

  describe("#getId", () => {
    it("should return the transfer ID", () => {
      expect(transfer.getId()).toEqual(VALID_TRANSFER_MODEL.transfer_id);
    });
  });

  describe("#getNetworkId", () => {
    it("should return the network ID", () => {
      expect(transfer.getNetworkId()).toEqual(VALID_TRANSFER_MODEL.network_id);
    });
  });

  describe("#getWalletId", () => {
    it("should return the wallet ID", () => {
      expect(transfer.getWalletId()).toEqual(VALID_TRANSFER_MODEL.wallet_id);
    });
  });

  describe("#getFromAddressId", () => {
    it("should return the source address ID", () => {
      expect(transfer.getFromAddressId()).toEqual(VALID_TRANSFER_MODEL.address_id);
    });
  });

  describe("#getDestinationAddressId", () => {
    it("should return the destination address ID", () => {
      expect(transfer.getDestinationAddressId()).toEqual(VALID_TRANSFER_MODEL.destination);
    });
  });

  describe(".getAssetId", () => {
    it("should return the asset ID", () => {
      expect(transfer.getAssetId()).toEqual(VALID_TRANSFER_MODEL.asset_id);
    });
  });

  describe("#getAmount", () => {
    it("should return the ETH amount when the asset ID is eth", () => {
      expect(transfer.getAmount()).toEqual(ethAmount);
    });

    it("should return the amoun when the asset ID is not eth", () => {
      transferModel.asset_id = "usdc";
      transfer = Transfer.fromModel(transferModel);
      expect(transfer.getAmount()).toEqual(amount);
    });
  });

  describe("#getUnsignedPayload", () => {
    it("should return the unsigned payload", () => {
      expect(transfer.getUnsignedPayload()).toEqual(VALID_TRANSFER_MODEL.unsigned_payload);
    });
  });

  describe("#setSignedTransaction", () => {
    it("should return the unsigned payload", () => {
      const transfer = Transfer.fromModel(transferModel);
      const transaction = new ethers.Transaction();
      transfer.setSignedTransaction(transaction);
      expect(transfer.getTransaction()).toEqual(transaction);
    });
  });

  describe("#getSignedPayload", () => {
    it("should return undefined when the transfer has not been broadcast on chain", () => {
      expect(transfer.getSignedPayload()).toBeUndefined();
    });

    it("should return the signed payload when the transfer has been broadcast on chain", () => {
      transferModel.signed_payload = signedPayload;
      transfer = Transfer.fromModel(transferModel);
      expect(transfer.getSignedPayload()).toEqual(signedPayload);
    });
  });

  describe("#getTransactionHash", () => {
    it("should return undefined when the transfer has not been broadcast on chain", () => {
      expect(transfer.getTransactionHash()).toBeUndefined();
    });

    it("should return the transaction hash when the transfer has been broadcast on chain", () => {
      transferModel.transaction_hash = transactionHash;
      transfer = Transfer.fromModel(transferModel);
      expect(transfer.getTransactionHash()).toEqual(transactionHash);
    });
  });

  describe("#getTransactionLink", () => {
    it("should return the transaction link when the transaction hash is available", () => {
      expect(transfer.getTransactionLink()).toEqual(
        `https://sepolia.basescan.org/tx/${transferModel.transaction_hash}`,
      );
    });
  });

  describe("#getTransaction", () => {
    it("should return the Transfer transaction", () => {
      const transaction = transfer.getTransaction();
      expect(transaction).toBeInstanceOf(ethers.Transaction);
      expect(transaction.chainId).toEqual(BigInt("0x14a34"));
      expect(transaction.nonce).toEqual(Number("0x0"));
      expect(transaction.maxPriorityFeePerGas).toEqual(BigInt("0x59682f00"));
      expect(transaction.maxFeePerGas).toEqual(BigInt("0x59682f00"));
      expect(transaction.gasLimit).toEqual(BigInt("0x5208"));
      expect(transaction.to).toEqual(VALID_TRANSFER_MODEL.destination);
      expect(transaction.value).toEqual(BigInt(amount.toFixed(0)));
      expect(transaction.data).toEqual("0x");
    });
  });

  describe("#getStatus", () => {
    it("should return PENDING when the transaction has not been created", async () => {
      const status = transfer.getStatus();
      expect(status).toEqual(TransferStatus.PENDING);
    });

    it("should return PENDING when the transaction has been created but not broadcast", async () => {
      transfer = Transfer.fromModel(transferModel);
      const status = transfer.getStatus();
      expect(status).toEqual(TransferStatus.PENDING);
    });

    it("should return BROADCAST when the transaction has been broadcast but not included in a block", async () => {
      transferModel.status = TransferStatus.BROADCAST;
      transfer = Transfer.fromModel(transferModel);
      const status = transfer.getStatus();
      expect(status).toEqual(TransferStatus.BROADCAST);
    });

    it("should return COMPLETE when the transaction has confirmed", async () => {
      transferModel.status = TransferStatus.COMPLETE;
      transfer = Transfer.fromModel(transferModel);
      const status = transfer.getStatus();
      expect(status).toEqual(TransferStatus.COMPLETE);
    });

    it("should return FAILED when the transaction has failed", async () => {
      transferModel.status = TransferStatus.FAILED;
      transfer = Transfer.fromModel(transferModel);
      const status = transfer.getStatus();
      expect(status).toEqual(TransferStatus.FAILED);
    });

    it("should return undefined when the transaction does not exist", async () => {
      transferModel.status = "" as TransferStatus;
      transfer = Transfer.fromModel(transferModel);
      const status = transfer.getStatus();
      expect(status).toEqual(undefined);
    });
  });

  describe("#reload", () => {
    it("should return PENDING when the trnasaction has not been created", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.PENDING,
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.PENDING);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should return COMPLETE when the trnasaction is complete", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.COMPLETE,
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.COMPLETE);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should return FAILED when the trnasaction has failed", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        status: TransferStatus.FAILED,
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.FAILED);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });
  });
});

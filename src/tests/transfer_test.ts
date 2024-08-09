import { ethers } from "ethers";
import { Decimal } from "decimal.js";
import {
  Transfer as TransferModel,
  TransactionStatusEnum,
  SponsoredSendStatusEnum,
} from "../client/api";
import { TransactionStatus, TransferStatus, SponsoredSendStatus } from "../coinbase/types";
import { Transfer } from "../coinbase/transfer";
import { SponsoredSend } from "../coinbase/sponsored_send";
import { Transaction } from "../coinbase/transaction";
import { Coinbase } from "../coinbase/coinbase";
import { WEI_PER_ETHER } from "../coinbase/constants";
import {
  VALID_TRANSFER_MODEL,
  VALID_TRANSFER_SPONSORED_SEND_MODEL,
  mockReturnValue,
  mockReturnRejectedValue,
  transfersApiMock,
} from "./utils";
import { APIError } from "../coinbase/api_error";

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

  describe("#getAssetId", () => {
    it("should return the asset ID", () => {
      expect(transfer.getAssetId()).toEqual(VALID_TRANSFER_MODEL.asset_id);
    });
  });

  describe("#getAmount", () => {
    it("should return the ETH amount when the asset ID is eth", () => {
      expect(transfer.getAmount()).toEqual(ethAmount);
    });

    it("should return the amount when the asset ID is not eth", () => {
      transferModel.asset_id = "usdc";
      transferModel.asset.decimals = 6;
      transferModel.amount = "100000000";
      transfer = Transfer.fromModel(transferModel);
      expect(transfer.getAmount()).toEqual(new Decimal(100));
    });
  });

  describe("#getTransactionHash", () => {
    it("should return the transaction hash", () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          transaction_hash: transactionHash,
        },
      });
      expect(transfer.getTransactionHash()).toEqual(transactionHash);
    });
  });

  describe("#getTransactionLink", () => {
    it("should return the transaction link when the transaction hash is available", () => {
      expect(transfer.getTransactionLink()).toEqual(
        `https://sepolia.basescan.org/tx/${transferModel.transaction!.transaction_hash}`,
      );
    });
  });

  describe("#getTransaction", () => {
    it("should return the Transfer Transaction", () => {
      const transaction = transfer.getTransaction();
      expect(transaction).toBeInstanceOf(Transaction);
    });

    it("should return undefined when using sponsored sends", () => {
      const transfer = Transfer.fromModel(VALID_TRANSFER_SPONSORED_SEND_MODEL);
      const transaction = transfer.getTransaction();
      expect(transaction).toEqual(undefined);
    });
  });

  describe("#getRawTransaction", () => {
    it("should return the Transfer raw transaction", () => {
      const rawTransaction = transfer.getRawTransaction();
      expect(rawTransaction).toBeInstanceOf(ethers.Transaction);
    });

    it("should return undefined when using sponsored sends", () => {
      const transfer = Transfer.fromModel(VALID_TRANSFER_SPONSORED_SEND_MODEL);
      const rawTransaction = transfer.getRawTransaction();
      expect(rawTransaction).toEqual(undefined);
    });
  });

  describe("#getSponsoredSend", () => {
    it("should return the Transfer SponsoredSend", () => {
      const transfer = Transfer.fromModel(VALID_TRANSFER_SPONSORED_SEND_MODEL);
      const sponsoredSend = transfer.getSponsoredSend();
      expect(sponsoredSend).toBeInstanceOf(SponsoredSend);
    });

    it("should return undefined when not using sponsored sends", () => {
      const sponsoredSend = transfer.getSponsoredSend();
      expect(sponsoredSend).toEqual(undefined);
    });
  });

  describe("#getSendTransactionDelegate", () => {
    it("should return the Transfer SponsoredSend", () => {
      const transfer = Transfer.fromModel(VALID_TRANSFER_SPONSORED_SEND_MODEL);
      const sponsoredSend = transfer.getSendTransactionDelegate();
      expect(sponsoredSend).toBeInstanceOf(SponsoredSend);
    });

    it("should return the Transfer Transaction", () => {
      const transaction = transfer.getSendTransactionDelegate();
      expect(transaction).toBeInstanceOf(Transaction);
    });

    it("should return undefined when no SponsoredSend or Transaction is defined", () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_MODEL,
        transaction: undefined,
      });
      const sponsoredSend = transfer.getSponsoredSend();
      expect(sponsoredSend).toEqual(undefined);
    });
  });

  describe("#getStatus", () => {
    describe("when the send transaction delegate is a Transaction", () => {
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
        transferModel.transaction!.status = TransactionStatusEnum.Broadcast;
        transfer = Transfer.fromModel(transferModel);
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.BROADCAST);
      });

      it("should return COMPLETE when the transaction has confirmed", async () => {
        transferModel.transaction!.status = TransactionStatusEnum.Complete;
        transfer = Transfer.fromModel(transferModel);
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.COMPLETE);
      });

      it("should return FAILED when the transaction has failed", async () => {
        transferModel.transaction!.status = TransactionStatusEnum.Failed;
        transfer = Transfer.fromModel(transferModel);
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.FAILED);
      });

      it("should return undefined when the transaction does not exist", async () => {
        transferModel.transaction!.status = "" as TransactionStatusEnum;
        transfer = Transfer.fromModel(transferModel);
        const status = transfer.getStatus();
        expect(status).toEqual(undefined);
      });
    });

    describe("when the send transaction delegate is a SponsoredSend", () => {
      const transfer = Transfer.fromModel(VALID_TRANSFER_SPONSORED_SEND_MODEL);

      it("should return PENDING when the SponsoredSend has not been signed", async () => {
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.PENDING);
      });

      it("should return PENDING when the SponsoredSend has been signed but not submitted", async () => {
        const transfer = Transfer.fromModel({
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
          sponsored_send: {
            ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
            status: SponsoredSendStatusEnum.Signed,
          },
        });
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.PENDING);
      });

      it("should return BROADCAST when the SponsoredSend has been submitted", async () => {
        const transfer = Transfer.fromModel({
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
          sponsored_send: {
            ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
            status: SponsoredSendStatusEnum.Submitted,
          },
        });
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.BROADCAST);
      });

      it("should return COMPLETE when the SponsoredSend has been completed", async () => {
        const transfer = Transfer.fromModel({
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
          sponsored_send: {
            ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
            status: SponsoredSendStatusEnum.Complete,
          },
        });
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.COMPLETE);
      });

      it("should return FAILED when the SponsoredSend has failed", async () => {
        const transfer = Transfer.fromModel({
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
          sponsored_send: {
            ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
            status: SponsoredSendStatusEnum.Failed,
          },
        });
        const status = transfer.getStatus();
        expect(status).toEqual(TransferStatus.FAILED);
      });

      it("should return undefined when the SponsoredSend does not exist", async () => {
        const transfer = Transfer.fromModel({
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
          sponsored_send: {
            ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
            status: "" as SponsoredSendStatusEnum,
          },
        });
        const status = transfer.getStatus();
        expect(status).toEqual(undefined);
      });
    });
  });

  describe("#broadcast", () => {
    it("should return a broadcasted transfer when the send transaction delegate is a Transaction", async () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          signed_payload: "0xsignedHash",
        },
      });
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          status: TransactionStatus.BROADCAST,
        },
      });
      const broadcastedTransfer = await transfer.broadcast();
      expect(broadcastedTransfer).toBeInstanceOf(Transfer);
      expect(broadcastedTransfer.getStatus()).toEqual(TransferStatus.BROADCAST);
    });
    it("should return a broadcasted transfer when the send transaction delegate is a SponsoredSend", async () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
        sponsored_send: {
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
          signature: "0xsignedHash",
        },
      });
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnValue({
        ...VALID_TRANSFER_SPONSORED_SEND_MODEL,
        sponsored_send: {
          ...VALID_TRANSFER_SPONSORED_SEND_MODEL.sponsored_send!,
          status: SponsoredSendStatus.SUBMITTED,
        },
      });
      const broadcastedTransfer = await transfer.broadcast();
      expect(broadcastedTransfer).toBeInstanceOf(Transfer);
      expect(broadcastedTransfer.getStatus()).toEqual(TransferStatus.BROADCAST);
    });
    it("should throw when the sned transaction delegate has not been signed", async () => {
      expect(transfer.broadcast()).rejects.toThrow(new Error("Cannot broadcast unsigned Transfer"));
    });
    it("should thorw an APIErrror if the broadcastTransfer API call fails", async () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          signed_payload: "0xsignedHash",
        },
      });
      Coinbase.apiClients.transfer!.broadcastTransfer = mockReturnRejectedValue(
        new APIError("Failed to broadcast transfer"),
      );
      expect(transfer.broadcast()).rejects.toThrow(APIError);
    });
  });

  describe("#sign", () => {
    let signingKey: any = ethers.Wallet.createRandom();
    it("should return the signature", async () => {
      const transfer = Transfer.fromModel({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          signed_payload: "0xsignedHash",
        },
      });
      const signature = await transfer.sign(signingKey);
      expect(signature).toEqual(transfer.getTransaction()!.getSignature()!.slice(2));
    });
  });

  describe("#reload", () => {
    it("should return PENDING when the transaction has not been created", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          status: TransactionStatusEnum.Pending,
        },
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.PENDING);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should return COMPLETE when the transaction is complete", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          status: TransactionStatusEnum.Complete,
        },
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.COMPLETE);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });

    it("should return FAILED when the transaction has failed", async () => {
      Coinbase.apiClients.transfer!.getTransfer = mockReturnValue({
        ...VALID_TRANSFER_MODEL,
        transaction: {
          ...VALID_TRANSFER_MODEL.transaction!,
          status: TransactionStatusEnum.Failed,
        },
        status: TransferStatus.FAILED,
      });
      await transfer.reload();
      expect(transfer.getStatus()).toEqual(TransferStatus.FAILED);
      expect(Coinbase.apiClients.transfer!.getTransfer).toHaveBeenCalledTimes(1);
    });
  });

  describe("#toString", () => {
    it("returns the same value as toString", () => {
      expect(transfer.toString()).toEqual(
        `Transfer{transferId: '${transfer.getId()}', networkId: '${transfer.getNetworkId()}', ` +
          `fromAddressId: '${transfer.getFromAddressId()}', destinationAddressId: '${transfer.getDestinationAddressId()}', ` +
          `assetId: '${transfer.getAssetId()}', amount: '${transfer.getAmount()}', transactionHash: '${transfer.getTransactionHash()}', ` +
          `transactionLink: '${transfer.getTransactionLink()}', status: '${transfer.getStatus()!}'}`,
      );
    });
  });
});

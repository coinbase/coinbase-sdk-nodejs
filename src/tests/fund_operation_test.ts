import { FundOperation as FundOperationModel, Asset as AssetModel, FundOperationList, FundOperationStatusEnum } from "../client/api";
import { Coinbase } from "../coinbase/coinbase";
import {
  VALID_ASSET_MODEL,
  mockReturnValue,
  fundOperationsApiMock,
  assetApiMock,
  VALID_FUND_OPERATION_MODEL,
  VALID_FUND_QUOTE_MODEL,
} from "./utils";
import { Asset } from "../coinbase/asset";
import { FundOperation } from "../coinbase/fund_operation";
import Decimal from "decimal.js";
import { FundQuote } from "../coinbase/fund_quote";
import { CryptoAmount } from "../coinbase/crypto_amount";
import { TimeoutError } from "../coinbase/errors";
import { FundOperationStatus } from "../coinbase/types";

describe("FundOperation", () => {
 let assetModel: AssetModel;
  let asset: Asset;
  let fundOperationModel: FundOperationModel;
  let fundOperation: FundOperation;

  beforeEach(() => {
    Coinbase.apiClients.asset = assetApiMock;
    Coinbase.apiClients.fund = fundOperationsApiMock;

    assetModel = VALID_ASSET_MODEL;
    asset = Asset.fromModel(assetModel);

    fundOperationModel = VALID_FUND_OPERATION_MODEL;
    fundOperation = FundOperation.fromModel(fundOperationModel);

    Coinbase.apiClients.asset!.getAsset = mockReturnValue(assetModel);
    Coinbase.apiClients.fund!.createFundOperation = mockReturnValue(fundOperationModel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize a FundOperation object", () => {
      expect(fundOperation).toBeInstanceOf(FundOperation);
    });
  });

  describe(".create", () => {
    it("should create a new fund operation without quote", async () => {
      const newFundOperation = await FundOperation.create(fundOperationModel.wallet_id, fundOperationModel.address_id, new Decimal(fundOperationModel.crypto_amount.amount), fundOperationModel.crypto_amount.asset.asset_id, fundOperationModel.network_id);
      expect(newFundOperation).toBeInstanceOf(FundOperation);
      expect(Coinbase.apiClients.fund!.createFundOperation).toHaveBeenCalledWith(fundOperationModel.wallet_id, fundOperationModel.address_id, {
        fund_quote_id: undefined,
        amount: new Decimal(fundOperationModel.crypto_amount.amount).mul(10 ** asset.decimals).toString(),
        asset_id: fundOperationModel.crypto_amount.asset.asset_id,
      });
    });
    it("should create a new fund operation with quote", async () => {
      const newFundOperation = await FundOperation.create(fundOperationModel.wallet_id, fundOperationModel.address_id, new Decimal(fundOperationModel.crypto_amount.amount), fundOperationModel.crypto_amount.asset.asset_id, fundOperationModel.network_id, FundQuote.fromModel(VALID_FUND_QUOTE_MODEL));
      expect(newFundOperation).toBeInstanceOf(FundOperation);
      expect(Coinbase.apiClients.fund!.createFundOperation).toHaveBeenCalledWith(fundOperationModel.wallet_id, fundOperationModel.address_id, {
        fund_quote_id: VALID_FUND_QUOTE_MODEL.fund_quote_id,
        amount: new Decimal(fundOperationModel.crypto_amount.amount).mul(10 ** asset.decimals).toString(),
        asset_id: fundOperationModel.crypto_amount.asset.asset_id,
      });
    });
  });

  describe(".listFundOperations", () => {
    it("should list fund operations", async () => {
      const response = {
        data: [VALID_FUND_OPERATION_MODEL],
        has_more: false,
        next_page: "",
        total_count: 0,
      } as FundOperationList;
      Coinbase.apiClients.fund!.listFundOperations = mockReturnValue(response);
      const paginationResponse = await FundOperation.listFundOperations(fundOperationModel.wallet_id, fundOperationModel.address_id);
      const fundOperations = paginationResponse.data;
      expect(fundOperations).toHaveLength(1);
      expect(fundOperations[0]).toBeInstanceOf(FundOperation);
      expect(Coinbase.apiClients.fund!.listFundOperations).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.fund!.listFundOperations).toHaveBeenCalledWith(
        fundOperationModel.wallet_id,
        fundOperationModel.address_id,
        100,
        undefined,
      );
    });
    it("should handle pagination", async () => {
      const response = {
        data: [VALID_FUND_OPERATION_MODEL],
        has_more: true,
        next_page: "abc",
        total_count: 0,
      } as FundOperationList;
      Coinbase.apiClients.fund!.listFundOperations = mockReturnValue(response);
      const paginationResponse = await FundOperation.listFundOperations(fundOperationModel.wallet_id, fundOperationModel.address_id);
      expect(paginationResponse.nextPage).toEqual("abc");
      expect(paginationResponse.hasMore).toEqual(true);
      const fundOperations = paginationResponse.data;
      expect(fundOperations).toHaveLength(1);
      expect(fundOperations[0]).toBeInstanceOf(FundOperation);
      expect(Coinbase.apiClients.fund!.listFundOperations).toHaveBeenCalledTimes(1);
      expect(Coinbase.apiClients.fund!.listFundOperations).toHaveBeenCalledWith(
        fundOperationModel.wallet_id,
        fundOperationModel.address_id,
        100,
        undefined,
      );
    });
  });

  describe("#getId", () => {
    it("should return the fund operation ID", () => {
      expect(fundOperation.getId()).toEqual(fundOperationModel.fund_operation_id);
    });
  });

  describe("#getNetworkId", () => {
    it("should return the network ID", () => {
      expect(fundOperation.getNetworkId()).toEqual(fundOperationModel.network_id);
    });
  });

  describe("#getWalletId", () => {
    it("should return the wallet ID", () => {
      expect(fundOperation.getWalletId()).toEqual(fundOperationModel.wallet_id);
    });
  });

  describe("#getAddressId", () => {
    it("should return the address ID", () => {
      expect(fundOperation.getAddressId()).toEqual(fundOperationModel.address_id);
    });
  });

  describe("#getAsset", () => {
    it("should return the asset", () => {
      expect(fundOperation.getAsset()).toEqual(asset);
    });
  });

  describe("#getAmount", () => {
    it("should return the amount", () => {
      expect(fundOperation.getAmount()).toEqual(CryptoAmount.fromModel(fundOperationModel.crypto_amount));
    });
  });

  describe("#getFiatAmount", () => {
    it("should return the fiat amount", () => {
      expect(fundOperation.getFiatAmount()).toEqual(new Decimal(fundOperationModel.fiat_amount.amount));
    });
  });

  describe("#getFiatCurrency", () => {
    it("should return the fiat currency", () => {
      expect(fundOperation.getFiatCurrency()).toEqual(fundOperationModel.fiat_amount.currency);
    });
  });

  describe("#getStatus", () => {
    it("should return the current status", () => {
      expect(fundOperation.getStatus()).toEqual(fundOperationModel.status);
    });
  });

  describe("#reload", () => {
    it("should return PENDING when the fund operation has not been created", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatusEnum.Pending,
      });
      await fundOperation.reload();
      expect(fundOperation.getStatus()).toEqual(FundOperationStatus.PENDING);
      expect(Coinbase.apiClients.fund!.getFundOperation).toHaveBeenCalledTimes(1);
    });

    it("should return COMPLETE when the fund operation is complete", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatusEnum.Complete,
      });
      await fundOperation.reload();
      expect(fundOperation.getStatus()).toEqual(FundOperationStatus.COMPLETE);
      expect(Coinbase.apiClients.fund!.getFundOperation).toHaveBeenCalledTimes(1);
    });

    it("should return FAILED when the fund operation has failed", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatusEnum.Failed,
      });
      await fundOperation.reload();
      expect(fundOperation.getStatus()).toEqual(FundOperationStatus.FAILED);
      expect(Coinbase.apiClients.fund!.getFundOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe("#wait", () => {
    it("should wait for operation to complete", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatusEnum.Complete,
      });
      const completedFundOperation = await fundOperation.wait();
      expect(completedFundOperation).toBeInstanceOf(FundOperation);
      expect(completedFundOperation.getStatus()).toEqual(FundOperationStatus.COMPLETE);
      expect(Coinbase.apiClients.fund!.getFundOperation).toHaveBeenCalledTimes(1);
    });
    it("should return the failed fund operation when the operation has failed", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatusEnum.Failed,
      });
      const completedFundOperation = await fundOperation.wait();
      expect(completedFundOperation).toBeInstanceOf(FundOperation);
      expect(completedFundOperation.getStatus()).toEqual(FundOperationStatus.FAILED);
      expect(Coinbase.apiClients.fund!.getFundOperation).toHaveBeenCalledTimes(1);
    });
    it("should throw an error when the fund operation has not been created", async () => {
      Coinbase.apiClients.fund!.getFundOperation = mockReturnValue({
        ...VALID_FUND_OPERATION_MODEL,
        status: FundOperationStatus.PENDING,
      });
      await expect(fundOperation.wait({ timeoutSeconds: 0.05, intervalSeconds: 0.05 })).rejects.toThrow(new TimeoutError("Fund operation timed out"));
    });
  });
});

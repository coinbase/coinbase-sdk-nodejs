import { FundQuote } from "../coinbase/fund_quote";
import { FundQuote as FundQuoteModel, Asset as AssetModel } from "../client/api";
import { Coinbase } from "../coinbase/coinbase";
import {
  VALID_FUND_QUOTE_MODEL,
  VALID_ASSET_MODEL,
  mockReturnValue,
  fundOperationsApiMock,
  assetApiMock,
} from "./utils";
import { Asset } from "../coinbase/asset";
import Decimal from "decimal.js";
import { CryptoAmount } from "../coinbase/crypto_amount";
import { FundOperation } from "../coinbase/fund_operation";

describe("FundQuote", () => {
  let assetModel: AssetModel;
  let asset: Asset;
  let fundQuoteModel: FundQuoteModel;
  let fundQuote: FundQuote;

  beforeEach(() => {
    Coinbase.apiClients.asset = assetApiMock;
    Coinbase.apiClients.fund = fundOperationsApiMock;

    assetModel = VALID_ASSET_MODEL;
    asset = Asset.fromModel(assetModel);

    fundQuoteModel = VALID_FUND_QUOTE_MODEL;
    fundQuote = FundQuote.fromModel(fundQuoteModel);

    Coinbase.apiClients.asset!.getAsset = mockReturnValue(assetModel);
    Coinbase.apiClients.fund!.createFundQuote = mockReturnValue(fundQuoteModel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize a FundQuote object", () => {
      expect(fundQuote).toBeInstanceOf(FundQuote);
    });
  });

  describe(".create", () => {
    it("should create a new fund quote", async () => {
      const newFundQuote = await FundQuote.create(
        fundQuoteModel.wallet_id,
        fundQuoteModel.address_id,
        new Decimal(fundQuoteModel.crypto_amount.amount),
        fundQuoteModel.crypto_amount.asset.asset_id,
        fundQuoteModel.network_id,
      );
      expect(newFundQuote).toBeInstanceOf(FundQuote);
      expect(Coinbase.apiClients.asset!.getAsset).toHaveBeenCalledWith(
        fundQuoteModel.network_id,
        fundQuoteModel.crypto_amount.asset.asset_id,
      );
      expect(Coinbase.apiClients.fund!.createFundQuote).toHaveBeenCalledWith(
        fundQuoteModel.wallet_id,
        fundQuoteModel.address_id,
        {
          asset_id: Asset.primaryDenomination(fundQuoteModel.crypto_amount.asset.asset_id),
          amount: asset.toAtomicAmount(new Decimal(fundQuoteModel.crypto_amount.amount)).toString(),
        },
      );
    });
  });

  describe("#getId", () => {
    it("should return the fund quote ID", () => {
      expect(fundQuote.getId()).toEqual(fundQuoteModel.fund_quote_id);
    });
  });

  describe("#getNetworkId", () => {
    it("should return the network ID", () => {
      expect(fundQuote.getNetworkId()).toEqual(fundQuoteModel.network_id);
    });
  });

  describe("#getWalletId", () => {
    it("should return the wallet ID", () => {
      expect(fundQuote.getWalletId()).toEqual(fundQuoteModel.wallet_id);
    });
  });

  describe("#getAddressId", () => {
    it("should return the address ID", () => {
      expect(fundQuote.getAddressId()).toEqual(fundQuoteModel.address_id);
    });
  });

  describe("#getAsset", () => {
    it("should return the asset", () => {
      expect(fundQuote.getAsset()).toEqual(asset);
    });
  });

  describe("#getAmount", () => {
    it("should return the crypto amount", () => {
      const cryptoAmount = fundQuote.getAmount();
      expect(cryptoAmount.getAmount()).toEqual(
        new Decimal(fundQuoteModel.crypto_amount.amount).div(new Decimal(10).pow(asset.decimals)),
      );
      expect(cryptoAmount.getAsset()).toEqual(asset);
    });
  });

  describe("#getFiatAmount", () => {
    it("should return the fiat amount", () => {
      expect(fundQuote.getFiatAmount()).toEqual(new Decimal(fundQuoteModel.fiat_amount.amount));
    });
  });

  describe("#getFiatCurrency", () => {
    it("should return the fiat currency", () => {
      expect(fundQuote.getFiatCurrency()).toEqual(fundQuoteModel.fiat_amount.currency);
    });
  });

  describe("#getBuyFee", () => {
    it("should return the buy fee", () => {
      expect(fundQuote.getBuyFee()).toEqual({
        amount: fundQuoteModel.fees.buy_fee.amount,
        currency: fundQuoteModel.fees.buy_fee.currency,
      });
    });
  });

  describe("#getTransferFee", () => {
    it("should return the transfer fee", () => {
      expect(fundQuote.getTransferFee()).toEqual(
        CryptoAmount.fromModel(fundQuoteModel.fees.transfer_fee),
      );
    });
  });

  describe("#execute", () => {
    it("should execute the fund quote and create a fund operation", async () => {
      Coinbase.apiClients.fund!.createFundOperation = mockReturnValue(fundQuoteModel);
      const newFundOperation = await fundQuote.execute();
      expect(newFundOperation).toBeInstanceOf(FundOperation);
      expect(Coinbase.apiClients.fund!.createFundOperation).toHaveBeenCalledWith(
        fundQuoteModel.wallet_id,
        fundQuoteModel.address_id,
        {
          asset_id: Asset.primaryDenomination(fundQuoteModel.crypto_amount.asset.asset_id),
          amount: fundQuoteModel.crypto_amount.amount,
          fund_quote_id: fundQuoteModel.fund_quote_id,
        },
      );
    });
  });
});

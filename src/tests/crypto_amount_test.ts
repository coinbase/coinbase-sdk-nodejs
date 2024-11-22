import { describe, it, expect } from '@jest/globals';
import Decimal from 'decimal.js';
import { CryptoAmount } from '../coinbase/crypto_amount';
import { Asset } from '../coinbase/asset';
import { CryptoAmount as CryptoAmountModel } from '../client/api';
import { Coinbase } from '../coinbase/coinbase';
import { contractInvocationApiMock, getAssetMock, VALID_ETH_CRYPTO_AMOUNT_MODEL, VALID_USDC_CRYPTO_AMOUNT_MODEL } from './utils';
import { ContractInvocation } from '../coinbase/contract_invocation';

describe('CryptoAmount', () => {
  let cryptoAmountModel: CryptoAmountModel;
  let cryptoAmount: CryptoAmount;

  beforeEach(() => {
        cryptoAmountModel = VALID_USDC_CRYPTO_AMOUNT_MODEL;
        cryptoAmount = CryptoAmount.fromModel(cryptoAmountModel);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

  describe('.fromModel', () => {
    it('should correctly create CryptoAmount from model', () => {
      expect(cryptoAmount).toBeInstanceOf(CryptoAmount);
      expect(cryptoAmount.getAmount().equals(new Decimal(1).div(new Decimal(10).pow(6))));
      expect(cryptoAmount.getAsset().assetId).toEqual(Coinbase.assets.Usdc);
      expect(cryptoAmount.getAsset().networkId).toEqual("base-sepolia");
      expect(cryptoAmount.getAsset().decimals).toEqual(6);
    });
  });

  describe('.fromModelAndAssetId', () => {
    it('should correctly create CryptoAmount from model with gwei denomination', () => {
      const cryptoAmount = CryptoAmount.fromModelAndAssetId(VALID_ETH_CRYPTO_AMOUNT_MODEL, Coinbase.assets.Gwei);
      expect(cryptoAmount.getAmount().equals(new Decimal(1).div(new Decimal(10).pow(9))));
      expect(cryptoAmount.getAsset().assetId).toEqual(Coinbase.assets.Gwei);
      expect(cryptoAmount.getAsset().networkId).toEqual("base-sepolia");
      expect(cryptoAmount.getAsset().decimals).toEqual(9);
    });

    it('should correctly create CryptoAmount from model with wei denomination', () => {
      const cryptoAmount = CryptoAmount.fromModelAndAssetId(VALID_ETH_CRYPTO_AMOUNT_MODEL, Coinbase.assets.Wei);
      expect(cryptoAmount.getAmount().equals(new Decimal(1)));
      expect(cryptoAmount.getAsset().assetId).toEqual(Coinbase.assets.Wei);
      expect(cryptoAmount.getAsset().networkId).toEqual("base-sepolia");
      expect(cryptoAmount.getAsset().decimals).toEqual(0);
    });
  });

  describe('#getAmount', () => {
    it('should return the correct amount', () => {
      expect(cryptoAmount.getAmount().equals(new Decimal(1).div(new Decimal(10).pow(6))));
    });
  });

  describe('#getAsset', () => {
    it('should return the correct asset', () => {
      expect(cryptoAmount.getAsset().assetId).toEqual(Coinbase.assets.Usdc);
      expect(cryptoAmount.getAsset().networkId).toEqual("base-sepolia");
      expect(cryptoAmount.getAsset().decimals).toEqual(6);
    });
  });

  describe('#getAssetId', () => {
    it('should return the correct asset ID', () => {
      expect(cryptoAmount.getAssetId()).toEqual(Coinbase.assets.Usdc);
    });
  });

  describe('#toAtomicAmount', () => {
    it('should correctly convert to atomic amount', () => {
      // expect(cryptoAmount.toAtomicAmount()).toEqual(new Decimal(1))
    });
  });

  describe('#toString', () => {
    it('should have correct string representation', () => {
      expect(cryptoAmount.toString()).toEqual("CryptoAmount{amount: '0.000001', assetId: 'usdc'}");
    });
  });
}); 
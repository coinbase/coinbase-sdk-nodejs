import { Validator } from "../coinbase/validator";
import { ValidatorStatus } from "../coinbase/types";
import { Validator as ValidatorModel } from "../client";
import { Coinbase } from "../coinbase/coinbase";
import { ValidatorStatus as APIValidatorStatus } from "../client/api";

describe("Validator", () => {
  let validator: Validator;

  beforeEach(() => {
    const mockModel: ValidatorModel = {
      validator_id: "123",
      status: APIValidatorStatus.Active,
      network_id: Coinbase.networks.EthereumHoodi,
      asset_id: Coinbase.assets.Eth,
      details: {
        effective_balance: {
          amount: "100",
          asset: { network_id: Coinbase.networks.EthereumHoodi, asset_id: Coinbase.assets.Eth },
        },
        balance: {
          amount: "200",
          asset: { network_id: Coinbase.networks.EthereumHoodi, asset_id: Coinbase.assets.Eth },
        },
        exitEpoch: "epoch-1",
        activationEpoch: "epoch-0",
        index: "0",
        public_key: "public-key-123",
        slashed: false,
        withdrawableEpoch: "epoch-2",
        withdrawal_address: "withdrawal-address-123",
        withdrawal_credentials: "withdrawal-credentials-123",
        fee_recipient_address: "fee-recipient-address-123",
      },
    };

    validator = new Validator(mockModel);
  });

  test("getValidatorId should return the correct validator ID", () => {
    expect(validator.getValidatorId()).toBe("123");
  });

  test("getStatus should return the correct status", () => {
    expect(validator.getStatus()).toBe(ValidatorStatus.ACTIVE);
  });

  test("getNetworkId should return the correct network ID", () => {
    expect(validator.getNetworkId()).toBe(Coinbase.networks.EthereumHoodi);
  });

  test("getAssetId should return the correct asset ID", () => {
    expect(validator.getAssetId()).toBe(Coinbase.assets.Eth);
  });

  test("getActivationEpoch should return the correct activation epoch", () => {
    expect(validator.getActivationEpoch()).toBe("epoch-0");
  });

  test("getExitEpoch should return the correct exit epoch", () => {
    expect(validator.getExitEpoch()).toBe("epoch-1");
  });

  test("getIndex should return the correct index", () => {
    expect(validator.getIndex()).toBe("0");
  });

  test("getPublicKey should return the correct public key", () => {
    expect(validator.getPublicKey()).toBe("public-key-123");
  });

  test("isSlashed should return the correct slashed status", () => {
    expect(validator.isSlashed()).toBe(false);
  });

  test("getWithdrawableEpoch should return the correct withdrawable epoch", () => {
    expect(validator.getWithdrawableEpoch()).toBe("epoch-2");
  });

  test("getWithdrawalAddress should return the correct withdrawal address", () => {
    expect(validator.getWithdrawalAddress()).toBe("withdrawal-address-123");
  });

  test("getWithdrawalCredentials should return the correct withdrawal credentials", () => {
    expect(validator.getWithdrawalCredentials()).toBe("withdrawal-credentials-123");
  });

  test("getFeeRecipientAddress should return the correct fee recipient address", () => {
    expect(validator.getFeeRecipientAddress()).toBe("fee-recipient-address-123");
  });

  test("getForwardedFeeRecipientAddress should return the correct forwarded fee recipient address", () => {
    expect(validator.getForwardedFeeRecipientAddress()).toBe("");
  });

  test("getEffectiveBalance should return the correct effective balance", () => {
    expect(validator.getEffectiveBalance()).toEqual({
      amount: "100",
      asset: { network_id: Coinbase.networks.EthereumHoodi, asset_id: Coinbase.assets.Eth },
    });
  });

  test("getBalance should return the correct balance", () => {
    expect(validator.getBalance()).toEqual({
      amount: "200",
      asset: { network_id: Coinbase.networks.EthereumHoodi, asset_id: Coinbase.assets.Eth },
    });
  });
});

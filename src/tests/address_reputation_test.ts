import { AddressReputation } from "../coinbase/address_reputation";

describe("AddressReputation for risky address", () => {
  let addressReputation: AddressReputation;

  beforeEach(() => {
    addressReputation = new AddressReputation({
      score: -90,
      metadata: {
        unique_days_active: 1,
        total_transactions: 1,
        token_swaps_performed: 1,
        bridge_transactions_performed: 1,
        smart_contract_deployments: 1,
        longest_active_streak: 1,
        lend_borrow_stake_transactions: 1,
        ens_contract_interactions: 1,
        current_active_streak: 1,
        activity_period_days: 1,
      },
    });
  });

  it("returns the score", () => {
    expect(addressReputation.score).toBe(-90);
  });

  it("returns the metadata", () => {
    expect(addressReputation.metadata).toEqual({
      unique_days_active: 1,
      total_transactions: 1,
      token_swaps_performed: 1,
      bridge_transactions_performed: 1,
      smart_contract_deployments: 1,
      longest_active_streak: 1,
      lend_borrow_stake_transactions: 1,
      ens_contract_interactions: 1,
      current_active_streak: 1,
      activity_period_days: 1,
    });
  });

  it("returns the risky as true for score < 0", () => {
    expect(addressReputation.risky).toBe(true);
  });

  it("returns the string representation of the address reputation", () => {
    expect(addressReputation.toString()).toBe(
      "AddressReputation(score: -90, metadata: {unique_days_active: 1, total_transactions: 1, token_swaps_performed: 1, bridge_transactions_performed: 1, smart_contract_deployments: 1, longest_active_streak: 1, lend_borrow_stake_transactions: 1, ens_contract_interactions: 1, current_active_streak: 1, activity_period_days: 1})",
    );
  });

  it("should return risky as false for a score > 0", () => {
    addressReputation = new AddressReputation({
      score: 90,
      metadata: {
        unique_days_active: 1,
        total_transactions: 1,
        token_swaps_performed: 1,
        bridge_transactions_performed: 1,
        smart_contract_deployments: 1,
        longest_active_streak: 1,
        lend_borrow_stake_transactions: 1,
        ens_contract_interactions: 1,
        current_active_streak: 1,
        activity_period_days: 1,
      },
    });
    expect(addressReputation.risky).toBe(false);
  });

  it("should return risky as false for a score=0", () => {
    addressReputation = new AddressReputation({
      score: 0,
      metadata: {
        unique_days_active: 1,
        total_transactions: 1,
        token_swaps_performed: 1,
        bridge_transactions_performed: 1,
        smart_contract_deployments: 1,
        longest_active_streak: 1,
        lend_borrow_stake_transactions: 1,
        ens_contract_interactions: 1,
        current_active_streak: 1,
        activity_period_days: 1,
      },
    });
    expect(addressReputation.risky).toBe(false);
  });
});

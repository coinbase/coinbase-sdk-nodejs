import { FiatAmount } from "../coinbase/fiat_amount";
import { FiatAmount as FiatAmountModel } from "../client/api";

describe("FiatAmount", () => {
  describe(".fromModel", () => {
    it("should convert a FiatAmount model to a FiatAmount", () => {
      const model: FiatAmountModel = {
        amount: "100.50",
        currency: "USD",
      };

      const fiatAmount = FiatAmount.fromModel(model);

      expect(fiatAmount.getAmount()).toBe("100.50");
      expect(fiatAmount.getCurrency()).toBe("USD");
    });
  });

  describe("#getAmount", () => {
    it("should return the correct amount", () => {
      const fiatAmount = new FiatAmount("50.25", "USD");
      expect(fiatAmount.getAmount()).toBe("50.25");
    });
  });

  describe("#getCurrency", () => {
    it("should return the correct currency", () => {
      const fiatAmount = new FiatAmount("50.25", "USD");
      expect(fiatAmount.getCurrency()).toBe("USD");
    });
  });

  describe("#toString", () => {
    it("should return the correct string representation", () => {
      const fiatAmount = new FiatAmount("75.00", "USD");
      const expectedStr = "FiatAmount(amount: '75.00', currency: 'USD')";

      expect(fiatAmount.toString()).toBe(expectedStr);
    });
  });
});

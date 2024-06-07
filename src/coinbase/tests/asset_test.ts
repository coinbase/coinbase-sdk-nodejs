import Decimal from "decimal.js";
import { Asset } from "./../asset";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER, WEI_PER_GWEI } from "./../constants";

describe("Asset", () => {
  describe(".isSupported", () => {
    ["eth", "gwei", "wei", "usdc", "weth"].forEach(assetId => {
      describe(`when the assetId is ${assetId}`, () => {
        it("should return true", () => {
          expect(Asset.isSupported(assetId)).toBe(true);
        });
      });
    });

    describe("when the assetId is not supported", () => {
      it("should return false", () => {
        expect(Asset.isSupported("unsupported")).toBe(false);
      });
    });
  });

  describe(".toAtomicAmount", () => {
    const amount = new Decimal(123.0);

    describe("when the assetId is eth", () => {
      it("should return the amount in atomic units", () => {
        expect(Asset.toAtomicAmount(amount, "eth")).toEqual(amount.mul(WEI_PER_ETHER));
      });
    });

    describe("when the assetId is gwei", () => {
      it("should return the amount in atomic units", () => {
        expect(Asset.toAtomicAmount(amount, "gwei")).toEqual(amount.mul(WEI_PER_GWEI));
      });
    });

    describe("when the assetId is usdc", () => {
      it("should return the amount in atomic units", () => {
        expect(Asset.toAtomicAmount(amount, "usdc")).toEqual(amount.mul(ATOMIC_UNITS_PER_USDC));
      });
    });

    describe("when the assetId is weth", () => {
      it("should return the amount in atomic units", () => {
        expect(Asset.toAtomicAmount(amount, "weth")).toEqual(amount.mul(WEI_PER_ETHER));
      });
    });

    describe("when the assetId is wei", () => {
      it("should return the amount", () => {
        expect(Asset.toAtomicAmount(amount, "wei")).toEqual(amount);
      });
    });

    describe("when the assetId is not explicitly handled", () => {
      it("should return the amount", () => {
        expect(Asset.toAtomicAmount(amount, "other")).toEqual(amount);
      });
    });
  });

  describe(".fromAtomicAmount", () => {
    const atomicAmount = new Decimal("123000000000000000000");

    describe("when the assetId is eth", () => {
      it("should return the amount in whole units", () => {
        expect(Asset.fromAtomicAmount(atomicAmount, "eth")).toEqual(
          atomicAmount.div(WEI_PER_ETHER),
        );
      });
    });

    describe("when the assetId is gwei", () => {
      it("should return the amount in gwei", () => {
        expect(Asset.fromAtomicAmount(atomicAmount, "gwei")).toEqual(
          atomicAmount.div(WEI_PER_GWEI),
        );
      });
    });

    describe("when the assetId is usdc", () => {
      it("should return the amount in whole units", () => {
        expect(Asset.fromAtomicAmount(atomicAmount, "usdc")).toEqual(
          atomicAmount.div(ATOMIC_UNITS_PER_USDC),
        );
      });
    });

    describe("when the assetId is weth", () => {
      it("should return the amount in whole units", () => {
        expect(Asset.fromAtomicAmount(atomicAmount, "weth")).toEqual(
          atomicAmount.div(WEI_PER_ETHER),
        );
      });
    });

    describe("when the assetId is wei", () => {
      it("should return the amount", () => {
        expect(Asset.fromAtomicAmount(atomicAmount, "wei")).toEqual(atomicAmount);
      });
    });
  });

  describe(".primaryDenomination", () => {
    ["wei", "gwei"].forEach(assetId => {
      describe(`when the assetId is ${assetId}`, () => {
        it("should return 'eth'", () => {
          expect(Asset.primaryDenomination(assetId)).toEqual("eth");
        });
      });
    });

    describe("when the assetId is not wei or gwei", () => {
      it("should return the assetId", () => {
        expect(Asset.primaryDenomination("other")).toEqual("other");
      });
    });
  });
});

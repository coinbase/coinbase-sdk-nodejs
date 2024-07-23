import { Address } from "../index";
import { VALID_ADDRESS_MODEL } from "./utils";

describe("Address", () => {
  describe(".getNetworkId", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.getNetworkId()).toEqual(VALID_ADDRESS_MODEL.network_id);
    });
  });
  describe(".geId", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.getId()).toEqual(VALID_ADDRESS_MODEL.address_id);
    });
  });
  describe(".toString()", () => {
    it("should get the network ID", () => {
      const address = new Address(VALID_ADDRESS_MODEL.network_id, VALID_ADDRESS_MODEL.address_id);
      expect(address.toString()).toEqual(
        `Address { addressId: '${VALID_ADDRESS_MODEL.address_id}', networkId: '${VALID_ADDRESS_MODEL.network_id}' }`,
      );
    });
  });
});

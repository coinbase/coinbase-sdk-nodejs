import { Wallet } from "../../coinbase/wallet";
import { 
  VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL, 
  generateWalletFromSeed,
  VALID_WALLET_MODEL
} from "../utils";
import { PayloadSignature } from "../../coinbase/payload_signature";
import { APIError } from "../../coinbase/api_error";

jest.mock("../../coinbase/wallet");

describe("Wallet Payload Signature", () => {
	const existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
	const { address1 } = generateWalletFromSeed(existingSeed, 1);
	const unsignedPayload = VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL.unsigned_payload;

	const mockWalletModel = {
		...VALID_WALLET_MODEL,
		id: "mock-wallet-id",
		default_address: {
			...VALID_WALLET_MODEL.default_address,
			address_id: address1,
		},
	};

	let wallet: jest.Mocked<Wallet>;

	beforeEach(() => {
		jest.clearAllMocks();
		wallet = {
			getId: jest.fn().mockReturnValue(mockWalletModel.id),
			getDefaultAddress: jest.fn().mockResolvedValue({
				getId: jest.fn().mockReturnValue(mockWalletModel.default_address.address_id),
			}),
			createPayloadSignature: jest.fn(),
		} as unknown as jest.Mocked<Wallet>;
		(Wallet.init as jest.Mock).mockReturnValue(wallet);
	});

	describe("#createPayloadSignature", () => {
		it("should successfully create a payload signature", async () => {
			const mockPayloadSignature = new PayloadSignature(VALID_SIGNED_PAYLOAD_SIGNATURE_MODEL);
			wallet.createPayloadSignature.mockResolvedValue(mockPayloadSignature);

			const payloadSignature = await wallet.createPayloadSignature(unsignedPayload);

			expect(wallet.createPayloadSignature).toHaveBeenCalledWith(unsignedPayload);
			expect(payloadSignature).toBeInstanceOf(PayloadSignature);
		});

		it("should throw an APIError when the API call to create a payload signature fails", async () => {
			wallet.createPayloadSignature.mockRejectedValue(new APIError("Failed to create payload signature"));

			await expect(wallet.createPayloadSignature(unsignedPayload)).rejects.toThrow(APIError);
		});
	});
});
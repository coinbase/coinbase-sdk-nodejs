import { Coinbase } from "../../coinbase/coinbase";
import { Wallet } from "../../coinbase/wallet";
import { Webhook } from "../../coinbase/webhook";
import { 
  generateWalletFromSeed, 
  VALID_WALLET_MODEL,
  walletsApiMock,
  addressesApiMock
} from "../utils";
import { Webhook as WebhookModel } from '../../client'

jest.mock("../../coinbase/coinbase");
jest.mock("../../coinbase/wallet");
jest.mock("../../coinbase/webhook");

describe("Wallet Webhook", () => {
  const existingSeed = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
  const { address1, address2 } = generateWalletFromSeed(existingSeed, 2);

  const mockWalletModel = {
    ...VALID_WALLET_MODEL,
    id: "mock-wallet-id",
    default_address: {
      address_id: address1,
      wallet_id: "mock-wallet-id",
      network_id: VALID_WALLET_MODEL.network_id,
      public_key: "mock-public-key",
      index: 0,
    },
  };

  const mockWebhookModel: WebhookModel = {
    id: "test-id",
    network_id: "test-network",
    notification_uri: "https://example.com/callback",
    event_type: "wallet_activity",
    event_type_filter: { addresses: [address1], wallet_id: mockWalletModel.id },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Coinbase.apiClients.wallet = walletsApiMock;
    Coinbase.apiClients.address = addressesApiMock;

    // Mock the Webhook.init method
    (Webhook.init as jest.Mock).mockReturnValue({
      getEventTypeFilter: jest.fn().mockReturnValue(mockWebhookModel.event_type_filter),
      getEventType: jest.fn().mockReturnValue(mockWebhookModel.event_type),
    });
    // Mock the Wallet class and its createWebhook method
    (Wallet as jest.Mocked<typeof Wallet>).init.mockReturnValue({
      createWebhook: jest.fn().mockResolvedValue(Webhook.init(mockWebhookModel)),
    } as any);
  });

  describe("#createWebhook", () => {
    it("should create a webhook for the default address", async () => {
      const wallet = Wallet.init(mockWalletModel, existingSeed);
      const result = await wallet.createWebhook("https://example.com/callback");

      expect(result).toBeDefined();
      expect(result.getEventTypeFilter).toBeDefined();
      expect(result.getEventType).toBeDefined();
      expect(result.getEventTypeFilter()?.wallet_id).toBe(mockWalletModel.id);
      expect(result.getEventTypeFilter()?.addresses).toStrictEqual([address1]);
      expect(result.getEventType()).toBe("wallet_activity");
    });
  });
});
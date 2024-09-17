import { Webhook } from "./../coinbase/webhook";
import { Coinbase } from "./../coinbase/coinbase";
import { Webhook as WebhookModel } from "../client/api";

describe("Webhook", () => {
  const mockModel: WebhookModel = {
    id: "test-id",
    network_id: "test-network",
    notification_uri: "https://example.com/callback",
    event_type: "erc20_transfer",
    event_type_filter: {
      addresses: ["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],
      wallet_id: "w1",
    },
    event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
    signature_header: "example_header",
  };

  beforeEach(() => {
    Coinbase.apiClients.webhook = {
      createWebhook: jest.fn().mockResolvedValue({ data: mockModel }),
      listWebhooks: jest.fn().mockResolvedValue({
        data: {
          data: [mockModel],
          has_more: false,
          next_page: null,
        },
      }),
      updateWebhook: jest.fn().mockImplementation((id, updateRequest) => {
        return Promise.resolve({
          data: {
            ...mockModel,
            notification_uri: updateRequest.notification_uri,
          },
        });
      }),
      deleteWebhook: jest.fn().mockResolvedValue({}),
    };
  });

  describe(".init", () => {
    it("should throw an error if the model is null", () => {
      expect(() => Webhook.init(null as any)).toThrow("Webhook model cannot be empty");
    });

    it("should create an instance of Webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook).toBeInstanceOf(Webhook);
    });
  });

  describe("#getId", () => {
    it("should return the ID of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getId()).toBe("test-id");
    });

    it("should return undefined if the ID is not set", () => {
      const modelWithoutId: WebhookModel = {
        ...mockModel,
        id: undefined,
      };
      const webhook = Webhook.init(modelWithoutId);
      expect(webhook.getId()).toBeUndefined();
    });
  });

  describe("#getNetworkId", () => {
    it("should return the network ID of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getNetworkId()).toBe("test-network");
    });

    it("should return undefined if the network ID is not set", () => {
      const modelWithoutNetworkId: WebhookModel = {
        ...mockModel,
        network_id: undefined,
      };
      const webhook = Webhook.init(modelWithoutNetworkId);
      expect(webhook.getNetworkId()).toBeUndefined();
    });
  });

  describe("#getNotificationURI", () => {
    it("should return the notification URI of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getNotificationURI()).toBe("https://example.com/callback");
    });

    it("should return undefined if the notification URI is not set", () => {
      const modelWithoutNotificationURI: WebhookModel = {
        ...mockModel,
        notification_uri: undefined,
      };
      const webhook = Webhook.init(modelWithoutNotificationURI);
      expect(webhook.getNotificationURI()).toBeUndefined();
    });
  });

  describe("#getEventType", () => {
    it("should return the event type of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getEventType()).toBe("erc20_transfer");
    });

    it("should return undefined if the event type is not set", () => {
      const modelWithoutEventType: WebhookModel = {
        ...mockModel,
        event_type: undefined,
      };
      const webhook = Webhook.init(modelWithoutEventType);
      expect(webhook.getEventType()).toBeUndefined();
    });
  });

  describe("#getEventFilters", () => {
    it("should return the event filters of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getEventFilters()).toEqual([
        { contract_address: "0x...", from_address: "0x...", to_address: "0x..." },
      ]);
    });

    it("should return undefined when event filters are not set", () => {
      const modelWithoutFilters: WebhookModel = {
        ...mockModel,
        event_filters: undefined,
      };
      const webhook = Webhook.init(modelWithoutFilters);
      expect(webhook.getEventFilters()).toBeUndefined();
    });
  });

  describe("#getSignatureHeader", () => {
    it("should return the signature header of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      expect(webhook.getSignatureHeader()).toBe("example_header");
    });

    it("should return undefined if the signature header is not set", () => {
      const modelWithoutSignatureHeader: WebhookModel = {
        ...mockModel,
        signature_header: undefined,
      };
      const webhook = Webhook.init(modelWithoutSignatureHeader);
      expect(webhook.getSignatureHeader()).toBeUndefined();
    });
  });

  describe(".create", () => {
    it("should create a new webhook", async () => {
      const webhook = await Webhook.create({
        networkId: "test-network",
        notificationUri: "https://example.com/callback",
        eventType: "erc20_transfer",
        eventTypeFilter: { addresses: ["0x1..", "0x2.."] },
        eventFilters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
        signatureHeader: "example_header",
      });

      expect(Coinbase.apiClients.webhook!.createWebhook).toHaveBeenCalledWith({
        network_id: "test-network",
        notification_uri: "https://example.com/callback",
        event_type: "erc20_transfer",
        event_type_filter: { addresses: ["0x1..", "0x2.."] },
        event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
        signature_header: "example_header",
      });
      expect(webhook).toBeInstanceOf(Webhook);
      expect(webhook.getId()).toBe("test-id");
    });

    it("should throw an error if creation fails", async () => {
      Coinbase.apiClients.webhook!.createWebhook = jest
        .fn()
        .mockRejectedValue(new Error("Failed to create webhook"));
      await expect(
        Webhook.create({
          networkId: "test-network",
          notificationUri: "https://example.com/callback",
          eventType: "erc20_transfer",
        }),
      ).rejects.toThrow("Failed to create webhook");
    });
  });

  describe(".list", () => {
    it("should list all webhooks", async () => {
      const webhooks = await Webhook.list();

      expect(Coinbase.apiClients.webhook!.listWebhooks).toHaveBeenCalledWith(100, undefined);
      expect(webhooks.length).toBe(1);
      expect(webhooks[0].getId()).toBe("test-id");
    });

    it("should list all webhooks across multiple pages", async () => {
      Coinbase.apiClients.webhook!.listWebhooks = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            data: [mockModel],
            has_more: true,
            next_page: "next-page-token",
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: [mockModel],
            has_more: false,
            next_page: null,
          },
        });

      const webhooks = await Webhook.list();

      expect(webhooks.length).toBe(2);
      expect(Coinbase.apiClients.webhook!.listWebhooks).toHaveBeenCalledTimes(2);
    });
  });

  describe("#update", () => {
    it("should update the webhook notification URI", async () => {
      const webhook = Webhook.init(mockModel);
      await webhook.update("https://new-url.com/callback");

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://new-url.com/callback",
        event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
      });

      expect(webhook.getNotificationURI()).toBe("https://new-url.com/callback");
    });
  });

  describe("#delete", () => {
    it("should delete the webhook and set the model to null", async () => {
      const webhook = Webhook.init(mockModel);
      await webhook.delete();

      expect(Coinbase.apiClients.webhook!.deleteWebhook).toHaveBeenCalledWith("test-id");
      expect(webhook.getId()).toBeUndefined();
      expect(webhook.getNetworkId()).toBeUndefined();
    });
  });

  describe("#toString", () => {
    it("should return a string representation of the webhook", () => {
      const webhook = Webhook.init(mockModel);
      const stringRepresentation = webhook.toString();
      expect(stringRepresentation).toBe(
        `Webhook { id: 'test-id', networkId: 'test-network', eventType: 'erc20_transfer', eventFilter: [{"contract_address":"0x...","from_address":"0x...","to_address":"0x..."}], eventTypeFilter: {"addresses":["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],"wallet_id":"w1"}, notificationUri: 'https://example.com/callback', signatureHeader: 'example_header' }`,
      );
    });
  });
});

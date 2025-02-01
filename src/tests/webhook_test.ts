import { Webhook } from "../coinbase/webhook";
import { Coinbase } from "../coinbase/coinbase";
import { Webhook as WebhookModel, WebhookWalletActivityFilter, WebhookStatus } from "../client/api";
import { mockReturnRejectedValue } from "./utils";
import { APIError } from "../coinbase/api_error";

describe("Webhook", () => {
  const mockModel: WebhookModel = {
    id: "test-id",
    network_id: "test-network",
    notification_uri: "https://example.com/callback",
    event_type: "erc20_transfer",
    event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
    status: WebhookStatus.Active,
  };

  const mockWalletActivityWebhookModel: WebhookModel = {
    id: "test-id",
    network_id: "test-network",
    notification_uri: "https://example.com/callback",
    event_type: "wallet_activity",
    event_type_filter: {
      addresses: ["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],
      wallet_id: "test-wallet-id",
    },
    status: WebhookStatus.Active,
  };

  const mockContractActivityWebhookModel: WebhookModel = {
    id: "test-id",
    network_id: "test-network",
    notification_uri: "https://example.com/callback",
    event_type: "smart_contract_event_activity",
    event_type_filter: {
      contract_addresses: ["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],
    },
    status: WebhookStatus.Active,
  };

  beforeEach(() => {
    Coinbase.apiClients.webhook = {
      createWalletWebhook: jest.fn().mockResolvedValue({ data: mockModel }),
      createWebhook: jest.fn().mockResolvedValue({ data: mockModel }),
      listWebhooks: jest.fn().mockResolvedValue({
        data: {
          data: [mockModel],
          has_more: true,
          next_page: null,
        },
      }),
      updateWebhook: jest.fn().mockImplementation((id, updateRequest) => {
        return Promise.resolve({
          data: {
            ...mockModel,
            notification_uri: updateRequest.notification_uri,
            event_type_filter: updateRequest.event_type_filter,
          },
        });
      }),
      deleteWebhook: jest.fn().mockResolvedValue({}),
    };
  });

  describe(".init", () => {
    it("should throw an error if the model is null", () => {
      expect(() => Webhook.init(null as never)).toThrow("Webhook model cannot be empty");
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
    it("should return undefined since the signature header can not be set via SDK", () => {
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
        eventFilters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
      });

      expect(Coinbase.apiClients.webhook!.createWebhook).toHaveBeenCalledWith({
        network_id: "test-network",
        notification_uri: "https://example.com/callback",
        event_type: "erc20_transfer",
        event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
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
      const paginationResponse = await Webhook.list({ limit: 1 });
      const webhooks = paginationResponse.data;

      expect(Coinbase.apiClients.webhook!.listWebhooks).toHaveBeenCalledWith(1, undefined);
      expect(webhooks.length).toBe(1);
      expect(webhooks[0].getId()).toBe("test-id");
      expect(paginationResponse.hasMore).toBe(true);
      expect(paginationResponse.nextPage).toBe(undefined);
    });

    it("should throw an error if list fails", async () => {
      Coinbase.apiClients.webhook!.listWebhooks = mockReturnRejectedValue(new APIError(""));
      await expect(Webhook.list()).rejects.toThrow(APIError);
    });
  });

  describe("#update", () => {
    it("should update the webhook notification URI", async () => {
      const webhook = Webhook.init(mockModel);
      await webhook.update({ notificationUri: "https://new-url.com/callback" });

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://new-url.com/callback",
        event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
      });

      expect(webhook.getNotificationURI()).toBe("https://new-url.com/callback");
    });
    it("should update the webhook address list only", async () => {
      const webhook = Webhook.init(mockModel);

      await webhook.update({
        eventTypeFilter: { wallet_id: "test-wallet-id", addresses: ["0x1..", "0x2.."] },
      });

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://example.com/callback",
        event_filters: [{ contract_address: "0x...", from_address: "0x...", to_address: "0x..." }],
        event_type_filter: { wallet_id: "test-wallet-id", addresses: ["0x1..", "0x2.."] },
      });

      expect(webhook.getNotificationURI()).toBe("https://example.com/callback");
      expect((webhook.getEventTypeFilter() as WebhookWalletActivityFilter)?.addresses).toEqual([
        "0x1..",
        "0x2..",
      ]);
    });
    it("should update both the webhook notification URI and the list of addresses monitoring", async () => {
      const webhook = Webhook.init(mockWalletActivityWebhookModel);
      await webhook.update({
        notificationUri: "https://new-url.com/callback",
        eventTypeFilter: { wallet_id: "test-wallet-id", addresses: ["0x1..", "0x2.."] },
      });

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://new-url.com/callback",
        event_type_filter: { addresses: ["0x1..", "0x2.."], wallet_id: "test-wallet-id" },
      });

      expect(webhook.getNotificationURI()).toBe("https://new-url.com/callback");
      expect(webhook.getEventTypeFilter()).toEqual({
        addresses: ["0x1..", "0x2.."],
        wallet_id: "test-wallet-id",
      });
    });
    it("should update notification URI for contract webhook", async () => {
      const webhook = Webhook.init(mockContractActivityWebhookModel);
      await webhook.update({
        notificationUri: "https://new-url-for-contract-webhook.com/callback",
      });

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://new-url-for-contract-webhook.com/callback",
        event_type_filter: {
          contract_addresses: ["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],
        },
      });

      expect(webhook.getNotificationURI()).toBe(
        "https://new-url-for-contract-webhook.com/callback",
      );
      expect(webhook.getEventTypeFilter()).toEqual({
        contract_addresses: ["0xa55C5950F7A3C42Fa5799B2Cac0e455774a07382"],
      });
    });
    it("should update contract addresses for contract webhook", async () => {
      const webhook = Webhook.init(mockContractActivityWebhookModel);
      await webhook.update({
        eventTypeFilter: {
          contract_addresses: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
        },
      });

      expect(Coinbase.apiClients.webhook!.updateWebhook).toHaveBeenCalledWith("test-id", {
        notification_uri: "https://example.com/callback",
        event_type_filter: {
          contract_addresses: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
        },
      });

      expect(webhook.getNotificationURI()).toBe("https://example.com/callback");
      expect(webhook.getEventTypeFilter()).toEqual({
        contract_addresses: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
      });
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
        `Webhook { id: 'test-id', networkId: 'test-network', eventType: 'erc20_transfer', eventFilter: [{"contract_address":"0x...","from_address":"0x...","to_address":"0x..."}], eventTypeFilter: undefined, notificationUri: 'https://example.com/callback', signatureHeader: 'undefined' }`,
      );
    });
  });
});

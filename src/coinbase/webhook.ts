import {
  Webhook as WebhookModel,
  WebhookEventType,
  WebhookEventFilter,
  WebhookEventTypeFilter,
  WebhookWalletActivityFilter,
} from "../client/api";
import { Coinbase } from "./coinbase";
import {
  CreateWebhookOptions,
  UpdateWebhookOptions,
  PaginationOptions,
  PaginationResponse,
} from "./types";

/**
 * A representation of a Webhook,
 * which provides methods to create, list, update, and delete webhooks that are used to receive notifications of specific events.
 */
export class Webhook {
  private model: WebhookModel | null;

  /**
   * Initializes a new Webhook object.
   *
   * @param model - The underlying Webhook object.
   * @throws {Error} If the model is not provided.
   */
  private constructor(model: WebhookModel) {
    if (!model) {
      throw new Error("Webhook model cannot be empty");
    }
    this.model = model;
  }

  /**
   * Returns a new Webhook object. Do not use this method directly. Instead, Webhook.create(...)
   *
   * @constructs Webhook
   * @param model - The underlying Webhook model object
   * @returns A Webhook object.
   */
  public static init(model: WebhookModel): Webhook {
    return new Webhook(model);
  }

  /**
   * Creates a new webhook for a specified network.
   *
   * @param options - The options to create webhook.
   * @param options.networkId - The network ID for which the webhook is created.
   * @param options.notificationUri - The URI where notifications should be sent.
   * @param options.eventType - The type of event for the webhook.
   * @param options.eventTypeFilter - Filter for wallet or smart contract activity event types.
   * @param options.eventFilters - Filters applied to the events that determine which specific events trigger the webhook.
   * @returns A promise that resolves to a new instance of Webhook.
   */
  public static async create({
    networkId,
    notificationUri,
    eventType,
    eventTypeFilter,
    eventFilters = [],
  }: CreateWebhookOptions): Promise<Webhook> {
    const result = await Coinbase.apiClients.webhook!.createWebhook({
      network_id: networkId,
      notification_uri: notificationUri,
      event_type: eventType,
      event_type_filter: eventTypeFilter,
      event_filters: eventFilters,
    });

    return new Webhook(result.data);
  }

  /**
   * Lists the Webhooks belonging to the CDP Project.
   *
   * @param options - The pagination options.
   * @param options.limit - The maximum number of Webhooks to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Webhooks. Don\&#39;t include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns The paginated list response of Webhooks.
   */
  public static async list({
    limit = Coinbase.defaultPageLimit,
    page = undefined,
  }: PaginationOptions = {}): Promise<PaginationResponse<Webhook>> {
    const data: Webhook[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.webhook!.listWebhooks(limit, page);

    const webhooks = response.data.data;
    for (const w of webhooks) {
      data.push(new Webhook(w));
    }

    const hasMore: boolean = response.data.has_more ? response.data.has_more : false;

    if (hasMore) {
      if (response.data.next_page) {
        nextPage = response.data.next_page;
      }
    }

    return {
      data,
      hasMore,
      nextPage,
    };
  }

  /**
   * Returns the ID of the webhook.
   *
   * @returns The ID of the webhook, or undefined if the model is null.
   */
  public getId(): string | undefined {
    return this.model?.id;
  }

  /**
   * Returns the network ID associated with the webhook.
   *
   * @returns The network ID of the webhook, or undefined if the model is null.
   */
  public getNetworkId(): string | undefined {
    return this.model?.network_id;
  }

  /**
   * Returns the notification URI of the webhook.
   *
   * @returns The URI where notifications are sent, or undefined if the model is null.
   */
  public getNotificationURI(): string | undefined {
    return this.model?.notification_uri;
  }

  /**
   * Returns the event type of the webhook.
   *
   * @returns The type of event the webhook listens for, or undefined if the model is null.
   */
  public getEventType(): WebhookEventType | undefined {
    return this.model?.event_type;
  }

  /**
   * Returns the event type filter of the webhook.
   *
   * @returns The filter which will be used to filter for events of a certain event type
   */
  public getEventTypeFilter(): WebhookEventTypeFilter | undefined {
    return this.model?.event_type_filter;
  }

  /**
   * Returns the event filters applied to the webhook.
   *
   * @returns An array of event filters used by the webhook, or undefined if the model is null.
   */
  public getEventFilters(): Array<WebhookEventFilter> | undefined {
    return this.model?.event_filters;
  }

  /**
   * Returns the signature header of the webhook.
   *
   * @returns The signature header which will be set on the callback requests, or undefined if the model is null.
   */
  public getSignatureHeader(): string | undefined {
    return this.model?.signature_header;
  }

  /**
   * Updates the webhook with a new notification URI, and optionally a new list of addresses to monitor.
   *
   * @param options - The options to update webhook.
   * @param options.notificationUri - The new URI for webhook notifications.
   * @param options.eventTypeFilter - The new eventTypeFilter that contains a new list (replacement) of addresses to monitor for the webhook.
   * @returns A promise that resolves to the updated Webhook object.
   */
  public async update({
    notificationUri,
    eventTypeFilter,
  }: UpdateWebhookOptions): Promise<Webhook> {
    const finalNotificationUri = notificationUri ?? this.getNotificationURI();
    const finalEventTypeFilter = eventTypeFilter ?? this.getEventTypeFilter();

    // wallet ID is required for wallet activity event type filter, but we do not support updating it just yet
    if (this.getEventType() === WebhookEventType.WalletActivity) {
      (finalEventTypeFilter as WebhookWalletActivityFilter).wallet_id = (
        this.getEventTypeFilter() as WebhookWalletActivityFilter
      )?.wallet_id;
    }

    const result = await Coinbase.apiClients.webhook!.updateWebhook(this.getId()!, {
      notification_uri: finalNotificationUri,
      event_filters: this.getEventFilters()!,
      event_type_filter: finalEventTypeFilter,
    });

    this.model = result.data;

    return this;
  }

  /**
   * Deletes the webhook.
   *
   * @returns A promise that resolves when the webhook is deleted and its attributes are set to null.
   */
  public async delete(): Promise<void> {
    await Coinbase.apiClients.webhook!.deleteWebhook(this.getId()!);

    this.model = null;
  }

  /**
   * Returns a String representation of the Webhook.
   *
   * @returns A String representation of the Webhook.
   */
  public toString(): string {
    return (
      `Webhook { id: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
      `eventType: '${this.getEventType()}', eventFilter: ${JSON.stringify(this.getEventFilters())}, ` +
      `eventTypeFilter: ${JSON.stringify(this.getEventTypeFilter())}, ` +
      `notificationUri: '${this.getNotificationURI()}', signatureHeader: '${this.getSignatureHeader()}' }`
    );
  }
}

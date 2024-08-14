import { Webhook as WebhookModel, WebhookEventType, WebhookEventFilter } from "../client/api";
import { Coinbase } from "./coinbase";
import { InternalError } from "./errors";

export class Webhook {
  private model: WebhookModel | null;

  constructor(model: WebhookModel) {
    if (!model) {
      throw new InternalError("Webhook model cannot be empty");
    }
    this.model = model;
  }

  public getId(): string | undefined {
    return this.model?.id;
  }

  public getNetworkId(): string | undefined {
    return this.model?.network_id;
  }

  public getNotificationURI(): string | undefined {
    return this.model?.notification_uri;
  }

  public getEventType(): WebhookEventType | undefined {
    return this.model?.event_type;
  }

  public getEventFilters(): Array<WebhookEventFilter> | undefined {
    return this.model?.event_filters
  }

  public static async create(
    networkId,
    notification_uri,
    event_type,
    event_filters,
  ): Promise<Webhook> {
    const result = await Coinbase.apiClients.webhook!.createWebhook({
      network_id: networkId,
      notification_uri: notification_uri,
      event_type: event_type,
      event_filters: event_filters,
    })

    return new Webhook(result.data);
  }

  public static async list(): Promise<Webhook[]> {
    const webhookList: Webhook[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const response = await Coinbase.apiClients.webhook!.listWebhooks(100, page ? page : undefined);

      const webhooks = response.data.data;
      for (const w of webhooks) {
        webhookList.push(new Webhook(w));
      }

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return webhookList;
  }

  public async update(notification_uri): Promise<Webhook> {
    const result = await Coinbase.apiClients.webhook!.updateWebhook(this.getId()!, {
        network_id: this.getNetworkId(),
        notification_uri: notification_uri,
        event_type: this.getEventType()!,
        event_filters: this.getEventFilters()!,
    })

    this.model = result.data;

    return this;
  }

  public async delete() {
    const result = await Coinbase.apiClients.webhook!.deleteWebhook(this.getId()!)

    this.model = null;
  }

  /**
   * Returns a String representation of the Webhook.
   *
   * @returns A String representation of the Webhook.
   */
  public toString(): string {
    return (
      `Webhook { id: '${this.getId()}', network_id: '${this.getNetworkId()}', ` +
      `event_type: '${this.getEventType()}', event_filter: '${JSON.stringify(this.getEventFilters())} ` + 
      `notification_uri: '${this.getNotificationURI()} }`
    );
  }
}

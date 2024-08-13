import { Decimal } from "decimal.js";
import { Webhook as WebhookModel, WebhookEventType, WebhookEventFilter } from "../client/api";
import { Coinbase } from "./coinbase";
import { InternalError } from "./errors";
import { delay } from "./utils";

/**
 * A representation of a Trade, which trades an amount of an Asset to another Asset on a Network.
 * The fee is assumed to be paid in the native Asset of the Network.
 */
export class Webhook {
  private model: WebhookModel;

  /**
   * Trades should be created through Wallet.trade or Address.trade.
   *
   * @class
   * @param model - The underlying Trade object.
   * @throws {InternalError} - If the Trade model is empty.
   */
  constructor(model: WebhookModel) {
    if (!model) {
      throw new InternalError("Webhook model cannot be empty");
    }
    this.model = model;
  }

  /**
   * Returns the Trade ID.
   *
   * @returns The Trade ID.
   */
  public getId(): string | undefined {
    return this.model.id;
  }

  /**
   * Returns the Network ID of the Trade.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string | undefined {
    return this.model.network_id;
  }

  /**
   * Returns the Wallet ID of the Trade.
   *
   * @returns The Wallet ID.
   */
  public getEventType(): WebhookEventType | undefined {
    return this.model.event_type;
  }

  /**
   * Returns the Address ID of the Trade.
   *
   * @returns The Address ID.
   */
  public getEventFilters(): Array<WebhookEventFilter> | undefined {
    return this.model.event_filters;
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

//   public static init(model: WebhookModel): Webhook {
//     const webhook = new Webhook(model);
//     if (Coinbase.useServerSigner) {
//       return wallet;
//     }
//     wallet.setMasterNode(seed);
//     return wallet;
//   }

  /**
   * Returns a String representation of the Trade.
   *
   * @returns A String representation of the Trade.
   */
  public toString(): string {
    return (
      `Webhook { id: '${this.getId()}', network_id: '${this.getNetworkId()}', ` +
      `event_type: '${this.getEventType()}', event_filter: '${this.getEventFilters()} }`
    );
  }
}

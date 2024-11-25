import { Decimal } from "decimal.js";
import { FundOperation as FundOperationModel } from "../client/api";
import { Asset } from "./asset";
import { Coinbase } from "./coinbase";
import { delay } from "./utils";
import { TimeoutError } from "./errors";
import { FundQuote } from "./fund_quote";
import { FundOperationStatus, PaginationOptions, PaginationResponse } from "./types";
import { CryptoAmount } from "./crypto_amount";

/**
 * A representation of a Fund Operation.
 */
export class FundOperation {
  /**
   * Fund Operation status constants.
   */
  public static readonly Status = {
    TERMINAL_STATES: new Set(["complete", "failed"]),
  } as const;

  private model: FundOperationModel;
  private asset: Asset | null = null;

  /**
   * Creates a new FundOperation instance.
   *
   * @param model - The model representing the fund operation
   */
  constructor(model: FundOperationModel) {
    this.model = model;
  }

  /**
   * Converts a FundOperationModel into a FundOperation object.
   *
   * @param fundOperationModel - The FundOperation model object.
   * @returns The FundOperation object.
   */
  public static fromModel(fundOperationModel: FundOperationModel): FundOperation {
    return new FundOperation(fundOperationModel);
  }

  /**
   * Create a new Fund Operation.
   *
   * @param walletId - The Wallet ID
   * @param addressId - The Address ID
   * @param amount - The amount of the Asset
   * @param assetId - The Asset ID
   * @param networkId - The Network ID
   * @param quote - Optional Fund Quote
   * @returns The new FundOperation object
   */
  public static async create(
    walletId: string,
    addressId: string,
    amount: Decimal,
    assetId: string,
    networkId: string,
    quote?: FundQuote,
  ): Promise<FundOperation> {
    const asset = await Asset.fetch(networkId, assetId);

    const createRequest = {
      amount: asset.toAtomicAmount(amount).toString(),
      asset_id: Asset.primaryDenomination(assetId),
    };

    if (quote) {
      Object.assign(createRequest, { fund_quote_id: quote.getId() });
    }

    const response = await Coinbase.apiClients.fund!.createFundOperation(
      walletId,
      addressId,
      createRequest,
    );

    return FundOperation.fromModel(response.data);
  }

  /**
   * List fund operations.
   *
   * @param walletId - The wallet ID
   * @param addressId - The address ID
   * @param options - The pagination options
   * @param options.limit - The maximum number of Fund Operations to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Fund Operations. Don't include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   * @returns The paginated list response of fund operations
   */
  public static async listFundOperations(
    walletId: string,
    addressId: string,
    { limit = Coinbase.defaultPageLimit, page = undefined }: PaginationOptions = {},
  ): Promise<PaginationResponse<FundOperation>> {
    const data: FundOperation[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.fund!.listFundOperations(
      walletId,
      addressId,
      limit,
      page,
    );

    response.data.data.forEach(operationModel => {
      data.push(FundOperation.fromModel(operationModel));
    });

    const hasMore = response.data.has_more;

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
   * Gets the Fund Operation ID.
   *
   * @returns {string} The unique identifier of the fund operation
   */
  public getId(): string {
    return this.model.fund_operation_id;
  }

  /**
   * Gets the Network ID.
   *
   * @returns {string} The network identifier
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Gets the Wallet ID.
   *
   * @returns {string} The wallet identifier
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Gets the Address ID.
   *
   * @returns {string} The address identifier
   */
  public getAddressId(): string {
    return this.model.address_id;
  }

  /**
   * Gets the Asset.
   *
   * @returns {Asset} The asset associated with this operation
   */
  public getAsset(): Asset {
    if (!this.asset) {
      this.asset = Asset.fromModel(this.model.crypto_amount.asset);
    }
    return this.asset;
  }

  /**
   * Gets the amount.
   *
   * @returns {CryptoAmount} The crypto amount
   */
  public getAmount(): CryptoAmount {
    return CryptoAmount.fromModel(this.model.crypto_amount);
  }

  /**
   * Gets the fiat amount.
   *
   * @returns {Decimal} The fiat amount in decimal format
   */
  public getFiatAmount(): Decimal {
    return new Decimal(this.model.fiat_amount.amount);
  }

  /**
   * Gets the fiat currency.
   *
   * @returns {string} The fiat currency code
   */
  public getFiatCurrency(): string {
    return this.model.fiat_amount.currency;
  }

  /**
   * Returns the Status of the Transfer.
   *
   * @returns The Status of the Transfer.
   */
  public getStatus(): FundOperationStatus {
    switch (this.model.status) {
      case FundOperationStatus.PENDING:
        return FundOperationStatus.PENDING;
      case FundOperationStatus.COMPLETE:
        return FundOperationStatus.COMPLETE;
      case FundOperationStatus.FAILED:
        return FundOperationStatus.FAILED;
      default:
        throw new Error(`Unknown fund operation status: ${this.model.status}`);
    }
  }

  /**
   * Reloads the fund operation from the server.
   *
   * @returns {Promise<FundOperation>} A promise that resolves to the updated fund operation
   */
  public async reload(): Promise<FundOperation> {
    const response = await Coinbase.apiClients.fund!.getFundOperation(
      this.getWalletId(),
      this.getAddressId(),
      this.getId(),
    );
    this.model = response.data;
    return this;
  }

  /**
   * Wait for the fund operation to complete.
   *
   * @param options - Options for waiting
   * @param options.intervalSeconds - The interval between checks in seconds
   * @param options.timeoutSeconds - The timeout in seconds
   * @returns The completed fund operation
   * @throws {TimeoutError} If the operation takes too long
   */
  public async wait({ intervalSeconds = 0.2, timeoutSeconds = 20 } = {}): Promise<FundOperation> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the FundOperation is in a terminal state, return the FundOperation
      if (this.isTerminalState()) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("Fund operation timed out");
  }

  /**
   * Check if the operation is in a terminal state.
   *
   * @returns {boolean} True if the operation is in a terminal state, false otherwise
   */
  private isTerminalState(): boolean {
    return FundOperation.Status.TERMINAL_STATES.has(this.getStatus());
  }
}

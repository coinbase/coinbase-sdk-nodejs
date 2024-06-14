import { ethers } from "ethers";
import { Decimal } from "decimal.js";
import { Address as AddressModel } from "../client";
import { Balance } from "./balance";
import { BalanceMap } from "./balance_map";
import { Coinbase } from "./coinbase";
import { ArgumentError, InternalError } from "./errors";
import { FaucetTransaction } from "./faucet_transaction";
import { Amount, Destination, TransferStatus } from "./types";
import { Transfer } from "./transfer";
import { convertAmount, delay, destinationToAddressHexString, getNormalizedAssetId } from "./utils";
import { Asset } from "./asset";
import { Trade } from "./trade";

/**
 * A representation of a blockchain address, which is a user-controlled account on a network.
 */
export class Address {
  private model: AddressModel;
  private key?: ethers.Wallet;

  /**
   * Initializes a new Address instance.
   *
   * @param model - The address model data.
   * @param key - The ethers.js Wallet the Address uses to sign data.
   * @throws {InternalError} If the model or key is empty.
   */
  constructor(model: AddressModel, key?: ethers.Wallet) {
    if (!model) {
      throw new InternalError("Address model cannot be empty");
    }
    this.model = model;
    this.key = key;
  }

  /**
   * Requests faucet funds for the address.
   * Only supported on testnet networks.
   *
   * @returns {Promise<FaucetTransaction>} The faucet transaction object.
   * @throws {InternalError} If the request does not return a transaction hash.
   * @throws {Error} If the request fails.
   */
  async faucet(): Promise<FaucetTransaction> {
    const response = await Coinbase.apiClients.address!.requestFaucetFunds(
      this.model.wallet_id,
      this.model.address_id,
    );
    return new FaucetTransaction(response.data);
  }

  /**
   * Returns the address ID.
   *
   * @returns {string} The address ID.
   */
  public getId(): string {
    return this.model.address_id;
  }

  /**
   * Returns the network ID.
   *
   * @returns {string} The network ID.
   */
  public getNetworkId(): string {
    return this.model.network_id;
  }

  /**
   * Returns the list of balances for the address.
   *
   * @returns {BalanceMap} - The map from asset ID to balance.
   */
  async listBalances(): Promise<BalanceMap> {
    const response = await Coinbase.apiClients.address!.listAddressBalances(
      this.model.wallet_id,
      this.model.address_id,
    );

    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns all of the transfers associated with the address.
   *
   * @returns {Transfer[]} The list of transfers.
   */
  async getTransfers(): Promise<Transfer[]> {
    const transfers: Transfer[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const response = await Coinbase.apiClients.transfer!.listTransfers(
        this.model.wallet_id,
        this.model.address_id,
        100,
        page?.length ? page : undefined,
      );

      response.data.data.forEach(transferModel => {
        transfers.push(Transfer.fromModel(transferModel));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return transfers;
  }

  /**
   * Returns the balance of the provided asset.
   *
   * @param {string} assetId - The asset ID.
   * @returns {Decimal} The balance of the asset.
   */
  async getBalance(assetId: string): Promise<Decimal> {
    const normalizedAssetId = getNormalizedAssetId(assetId);

    const response = await Coinbase.apiClients.address!.getAddressBalance(
      this.model.wallet_id,
      this.model.address_id,
      normalizedAssetId,
    );

    if (!response.data) {
      return new Decimal(0);
    }

    return Balance.fromModelAndAssetId(response.data, assetId).amount;
  }

  /**
   * Returns the wallet ID.
   *
   * @returns {string} The wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Transfers the given amount of the given Asset to the given address. Only same-Network Transfers are supported.
   *
   * @param amount - The amount of the Asset to send.
   * @param assetId - The ID of the Asset to send. For Ether, Coinbase.assets.Eth, Coinbase.assets.Gwei, and Coinbase.assets.Wei supported.
   * @param destination - The destination of the transfer. If a Wallet, sends to the Wallet's default address. If a String, interprets it as the address ID.
   * @param intervalSeconds - The interval at which to poll the Network for Transfer status, in seconds.
   * @param timeoutSeconds - The maximum amount of time to wait for the Transfer to complete, in seconds.
   * @returns The transfer object.
   * @throws {APIError} if the API request to create a Transfer fails.
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   * @throws {Error} if the Transfer times out.
   */
  public async createTransfer(
    amount: Amount,
    assetId: string,
    destination: Destination,
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  ): Promise<Transfer> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new InternalError("Cannot transfer from address without private key loaded");
    }
    let normalizedAmount = new Decimal(amount.toString());

    const currentBalance = await this.getBalance(assetId);
    if (currentBalance.lessThan(normalizedAmount)) {
      throw new ArgumentError(
        `Insufficient funds: ${normalizedAmount} requested, but only ${currentBalance} available`,
      );
    }

    normalizedAmount = convertAmount(normalizedAmount, assetId);
    const normalizedDestination = destinationToAddressHexString(destination);

    const normalizedAssetId = getNormalizedAssetId(assetId);

    const createTransferRequest = {
      amount: normalizedAmount.toFixed(0),
      network_id: this.getNetworkId(),
      asset_id: normalizedAssetId,
      destination: normalizedDestination,
    };

    let response = await Coinbase.apiClients.transfer!.createTransfer(
      this.getWalletId(),
      this.getId(),
      createTransferRequest,
    );

    let transfer = Transfer.fromModel(response.data);

    if (!Coinbase.useServerSigner) {
      const transaction = transfer.getTransaction();
      let signedPayload = await this.key!.signTransaction(transaction);
      signedPayload = signedPayload.slice(2);

      const broadcastTransferRequest = {
        signed_payload: signedPayload,
      };

      response = await Coinbase.apiClients.transfer!.broadcastTransfer(
        this.getWalletId(),
        this.getId(),
        transfer.getId(),
        broadcastTransferRequest,
      );

      transfer = Transfer.fromModel(response.data);
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await transfer.reload();
      const status = transfer.getStatus();
      if (status === TransferStatus.COMPLETE || status === TransferStatus.FAILED) {
        return transfer;
      }
      await delay(intervalSeconds);
    }
    throw new Error("Transfer timed out");
  }

  /**
   * Trades the given amount of the given Asset for another Asset. Only same-network Trades are supported.
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAssetId - The ID of the Asset to trade from. For Ether, eth, gwei, and wei are supported.
   * @param toAssetId - The ID of the Asset to trade to. For Ether, eth, gwei, and wei are supported.
   * @returns The Trade object.
   * @throws {Error} If the private key is not loaded, or if the asset IDs are unsupported, or if there are insufficient funds.
   */
  public async createTrade(amount: Amount, fromAssetId: string, toAssetId: string): Promise<Trade> {
    await this.validateCanTrade(amount, fromAssetId, toAssetId);
    const trade = await this.createTradeRequest(amount, fromAssetId, toAssetId);
    // NOTE: Trading does not yet support server signers at this point.
    const signed_payload = await trade.getTransaction().sign(this.key!);
    const approveTransactionSignedPayload = trade.getApproveTransaction()
      ? await trade.getApproveTransaction()!.sign(this.key!)
      : undefined;

    return this.broadcastTradeRequest(trade, signed_payload, approveTransactionSignedPayload);
  }

  /**
   * Creates a trade model for the specified amount and assets.
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAssetId - The ID of the Asset to trade from. For Ether, eth, gwei, and wei are supported.
   * @param toAssetId - The ID of the Asset to trade to. For Ether, eth, gwei, and wei are supported.
   * @returns A promise that resolves to a Trade object representing the new trade.
   */
  private async createTradeRequest(
    amount: Amount,
    fromAssetId: string,
    toAssetId: string,
  ): Promise<Trade> {
    const tradeRequestPayload = {
      amount: Asset.toAtomicAmount(new Decimal(amount.toString()), fromAssetId).toString(),
      from_asset_id: Asset.primaryDenomination(fromAssetId),
      to_asset_id: Asset.primaryDenomination(toAssetId),
    };
    const tradeModel = await Coinbase.apiClients.trade!.createTrade(
      this.getWalletId(),
      this.getId(),
      tradeRequestPayload,
    );
    return new Trade(tradeModel?.data);
  }

  /**
   * Broadcasts a trade using the provided signed payloads.
   *
   * @param trade - The Trade object representing the trade.
   * @param signedPayload - The signed payload of the trade.
   * @param approveTransactionPayload - The signed payload of the approval transaction, if any.
   * @returns A promise that resolves to a Trade object representing the broadcasted trade.
   */
  private async broadcastTradeRequest(
    trade: Trade,
    signedPayload: string,
    approveTransactionPayload?: string,
  ): Promise<Trade> {
    const broadcastTradeRequestPayload = {
      signed_payload: signedPayload,
      approve_transaction_signed_payload: approveTransactionPayload
        ? approveTransactionPayload
        : undefined,
    };

    const response = await Coinbase.apiClients.trade!.broadcastTrade(
      this.getWalletId(),
      this.getId(),
      trade.getId(),
      broadcastTradeRequestPayload,
    );

    return new Trade(response.data);
  }

  /**
   * Checks if trading is possible and raises an error if not.
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAssetId - The ID of the Asset to trade from. For Ether, eth, gwei, and wei are supported.
   * @param toAssetId - The ID of the Asset to trade to. For Ether, eth, gwei, and wei are supported.
   * @throws {Error} If the private key is not loaded, or if the asset IDs are unsupported, or if there are insufficient funds.
   */
  private async validateCanTrade(amount: Amount, fromAssetId: string, toAssetId: string) {
    if (!this.canSign()) {
      throw new Error("Cannot trade from address without private key loaded");
    }
    if (!Asset.isSupported(fromAssetId)) {
      throw new Error(`Unsupported from asset: ${fromAssetId}`);
    }
    if (!Asset.isSupported(toAssetId)) {
      throw new Error(`Unsupported to asset: ${toAssetId}`);
    }
    const currentBalance = await this.getBalance(fromAssetId);
    amount = new Decimal(amount.toString());
    if (currentBalance.lessThan(amount)) {
      throw new Error(
        `Insufficient funds: ${amount} requested, but only ${currentBalance} available`,
      );
    }
  }

  /**
   * Returns whether the Address has a private key backing it to sign transactions.
   *
   * @returns Whether the Address has a private key backing it to sign transactions.
   */
  public canSign(): boolean {
    return !!this.key;
  }

  /**
   * Returns a string representation of the address.
   *
   * @returns {string} A string representing the address.
   */
  public toString(): string {
    return `Coinbase:Address{addressId: '${this.model.address_id}', networkId: '${this.model.network_id}', walletId: '${this.model.wallet_id}'}`;
  }
}

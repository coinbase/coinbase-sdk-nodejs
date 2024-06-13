import { Decimal } from "decimal.js";
import { Address } from "../address";
import { Address as AddressModel } from "../../client";
import { ethers } from "ethers";
import { ArgumentError, InternalError } from "../errors";
import { Balance } from "../balance";
import { BalanceMap } from "../balance_map";
import { Coinbase } from "../coinbase";
import { Transfer } from "../transfer";
import { FaucetTransaction } from "../faucet_transaction";
import { delay, destinationToAddressHexString } from "../utils";
import { Amount, Destination, TransferStatus } from "../types";
import { ATOMIC_UNITS_PER_USDC, WEI_PER_ETHER, WEI_PER_GWEI } from "../constants";
import { Asset } from "../asset";
import { Trade } from "../trade";

/**
 * A representation of a blockchain address, which is a developer-controlled account on a network.
 */
export class DeveloperAddress extends Address {
  private _model: AddressModel;
  private _key?: ethers.SigningKey;

  /**
   * Initializes a new Developer Address instance.
   *
   * @param model - The address model data.
   * @param key - The ethers.js SigningKey the Address uses to sign data.
   * @throws {InternalError} If the address model is empty.
   */
  constructor(model: AddressModel, key?: ethers.SigningKey) {
    if (!model) {
      throw new InternalError("Address model cannot be empty");
    }
    super(model.network_id, model.address_id);

    this._model = model;
    this._key = key;
  }

  /**
   * Returns a string representation of the developer address.
   *
   * @returns {string} A string representing the developer address.
   */
  public toString(): string {
    return `Coinbase:DeveloperAddress{addressId: '${this.id}', networkId: '${this.networkId}', walletId: '${this.walletId}'}`;
  }

  /**
   * Returns the wallet ID.
   *
   * @returns {string} The wallet ID.
   */
  get walletId(): string {
    return this._model.wallet_id;
  }

  /**
   * Sets the private key.
   *
   * @param key - The ethers.js SigningKey the Address uses to sign data.
   * @throws {InternalError} If the private key is already set.
   */
  set key(key: ethers.SigningKey) {
    if (this._key !== undefined) {
      throw new InternalError("Private key is already set");
    }
    this._key = key;
  }

  /**
   * Returns the list of balances for the address.
   *
   * @returns {BalanceMap} - The map from asset ID to balance.
   */
  async balances(): Promise<BalanceMap> {
    const response = await Coinbase.apiClients.address!.listAddressBalances(
      this._model.wallet_id,
      this._model.address_id,
    );

    return BalanceMap.fromBalances(response.data.data);
  }

  /**
   * Returns the balance of the provided asset.
   *
   * @param {string} assetId - The asset ID.
   * @returns {Decimal} The balance of the asset.
   */
  async balance(assetId: string): Promise<Decimal> {
    const normalizedAssetId = ((): string => {
      switch (assetId) {
        case Coinbase.assets.Gwei:
          return Coinbase.assets.Eth;
        case Coinbase.assets.Wei:
          return Coinbase.assets.Eth;
        default:
          return assetId;
      }
    })();

    const response = await Coinbase.apiClients.address!.getAddressBalance(
      this._model.wallet_id,
      this._model.address_id,
      normalizedAssetId,
    );

    if (!response.data) {
      return new Decimal(0);
    }

    return Balance.fromModelAndAssetId(response.data, assetId).amount;
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
      this._model.wallet_id,
      this._model.address_id,
    );
    return new FaucetTransaction(response.data);
  }

  /**
   * Returns all the transfers associated with the address.
   *
   * @returns {Transfer[]} The list of transfers.
   */
  public async transfers(): Promise<Transfer[]> {
    const transfers: Transfer[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const response = await Coinbase.apiClients.transfer!.listTransfers(
        this._model.wallet_id,
        this._model.address_id,
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
  public async transfer(
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

    const currentBalance = await this.balance(assetId);
    if (currentBalance.lessThan(normalizedAmount)) {
      throw new ArgumentError(
        `Insufficient funds: ${normalizedAmount} requested, but only ${currentBalance} available`,
      );
    }

    switch (assetId) {
      case Coinbase.assets.Eth:
        normalizedAmount = normalizedAmount.mul(WEI_PER_ETHER);
        break;
      case Coinbase.assets.Gwei:
        normalizedAmount = normalizedAmount.mul(WEI_PER_GWEI);
        break;
      case Coinbase.assets.Wei:
        break;
      case Coinbase.assets.Weth:
        normalizedAmount = normalizedAmount.mul(WEI_PER_ETHER);
        break;
      case Coinbase.assets.Usdc:
        normalizedAmount = normalizedAmount.mul(ATOMIC_UNITS_PER_USDC);
        break;
      default:
        throw new InternalError(`Unsupported asset ID: ${assetId}`);
    }

    const normalizedDestination = destinationToAddressHexString(destination);

    const normalizedAssetId = ((): string => {
      switch (assetId) {
        case Coinbase.assets.Gwei:
          return Coinbase.assets.Eth;
        case Coinbase.assets.Wei:
          return Coinbase.assets.Eth;
        default:
          return assetId;
      }
    })();

    const createTransferRequest = {
      amount: normalizedAmount.toFixed(0),
      network_id: this.networkId,
      asset_id: normalizedAssetId,
      destination: normalizedDestination,
    };

    let response = await Coinbase.apiClients.transfer!.createTransfer(
      this.walletId,
      this.id,
      createTransferRequest,
    );

    let transfer = Transfer.fromModel(response.data);
    const wallet = new ethers.Wallet(this._key!);

    if (!Coinbase.useServerSigner) {
      const transaction = transfer.getTransaction();
      let signedPayload = await wallet!.signTransaction(transaction);
      signedPayload = signedPayload.slice(2);

      const broadcastTransferRequest = {
        signed_payload: signedPayload,
      };

      response = await Coinbase.apiClients.transfer!.broadcastTransfer(
        this.walletId,
        this.id,
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
   * Returns whether the Address has a private key backing it to sign transactions.
   *
   * @returns Whether the Address has a private key backing it to sign transactions.
   */
  public canSign(): boolean {
    return !!this.key;
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
  public async trade(amount: Amount, fromAssetId: string, toAssetId: string): Promise<Trade> {
    await this.validateCanTrade(amount, fromAssetId, toAssetId);
    const trade = await this.createTradeRequest(amount, fromAssetId, toAssetId);
    const wallet = new ethers.Wallet(this._key!);
    // NOTE: Trading does not yet support server signers at this point.
    const signed_payload = await trade.getTransaction().sign(wallet);
    const approveTransactionSignedPayload = trade.getApproveTransaction()
      ? await trade.getApproveTransaction()!.sign(wallet)
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
      this.walletId,
      this.id,
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
      this.walletId,
      this.id,
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
    const currentBalance = await this.balance(fromAssetId);
    amount = new Decimal(amount.toString());
    if (currentBalance.lessThan(amount)) {
      throw new Error(
        `Insufficient funds: ${amount} requested, but only ${currentBalance} available`,
      );
    }
  }
}

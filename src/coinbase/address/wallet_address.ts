import { Decimal } from "decimal.js";
import { ethers } from "ethers";
import { Address as AddressModel } from "../../client";
import { Address } from "../address";
import { Asset } from "../asset";
import { Coinbase } from "../coinbase";
import { ArgumentError } from "../errors";
import { Trade } from "../trade";
import { Transfer } from "../transfer";
import {
  Amount,
  CreateTransferOptions,
  CreateTradeOptions,
  Destination,
  TransferStatus,
  TransactionStatus,
  StakeOptionsMode,
} from "../types";
import { delay } from "../utils";
import { Wallet as WalletClass } from "../wallet";
import { StakingOperation } from "../staking_operation";

/**
 * A representation of a blockchain address, which is a wallet-controlled account on a network.
 */
export class WalletAddress extends Address {
  private model: AddressModel;
  private key?: ethers.Wallet;

  /**
   * Initializes a new Wallet Address instance.
   *
   * @param model - The address model data.
   * @param key - The ethers.js SigningKey the Address uses to sign data.
   * @throws {Error} If the address model is empty.
   */
  constructor(model: AddressModel, key?: ethers.Wallet) {
    if (!model) {
      throw new Error("Address model cannot be empty");
    }
    super(model.network_id, model.address_id);

    this.model = model;
    this.key = key;
  }

  /**
   * Returns a string representation of the wallet address.
   *
   * @returns A string representing the wallet address.
   */
  public toString(): string {
    return `WalletAddress{ addressId: '${this.getId()}', networkId: '${this.getNetworkId()}', walletId: '${this.getWalletId()}' }`;
  }

  /**
   * Returns the wallet ID.
   *
   * @returns The wallet ID.
   */
  public getWalletId(): string {
    return this.model.wallet_id;
  }

  /**
   * Sets the private key.
   *
   * @param key - The ethers.js SigningKey the Address uses to sign data.
   * @throws {Error} If the private key is already set.
   */
  public setKey(key: ethers.Wallet) {
    if (this.key !== undefined) {
      throw new Error("Private key is already set");
    }
    this.key = key;
  }

  /**
   * Gets the private key.
   */
  public export() {
    if (this.key === undefined) {
      throw new Error("Private key is not set")
    }

    return this.key.privateKey;
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
   * Returns all the trades associated with the address.
   *
   * @returns The list of trades.
   */
  public async listTrades(): Promise<Trade[]> {
    const trades: Trade[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();
      const response = await Coinbase.apiClients.trade!.listTrades(
        this.model.wallet_id,
        this.model.address_id,
        100,
        page?.length ? page : undefined,
      );

      response.data.data.forEach(tradeModel => {
        trades.push(new Trade(tradeModel));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return trades;
  }

  /**
   * Returns all the transfers associated with the address.
   *
   * @returns The list of transfers.
   */
  public async listTransfers(): Promise<Transfer[]> {
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
   * Transfers the given amount of the given Asset to the given address.
   * Only same-Network Transfers are supported.
   * This returns a `Transfer` object that has been signed and broadcasted, you
   * can wait for this to land on-chain (or fail) by calling `transfer.wait()`.
   *
   * @param options - The options to create the Transfer.
   * @param options.amount - The amount of the Asset to send.
   * @param options.assetId - The ID of the Asset to send. For Ether, Coinbase.assets.Eth, Coinbase.assets.Gwei, and Coinbase.assets.Wei supported.
   * @param options.destination - The destination of the transfer. If a Wallet, sends to the Wallet's default address. If a String, interprets it as the address ID.
   * @param options.gasless - Whether the Transfer should be gasless. Defaults to false.
   * @returns The transfer object.
   * @throws {APIError} if the API request to create a Transfer fails.
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   */
  public async createTransfer({
    amount,
    assetId,
    destination,
    gasless = false,
  }: CreateTransferOptions): Promise<Transfer> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot transfer from address without private key loaded");
    }
    const asset = await Asset.fetch(this.getNetworkId(), assetId);
    const [destinationAddress, destinationNetworkId] =
      this.getDestinationAddressAndNetwork(destination);

    const normalizedAmount = new Decimal(amount.toString());
    const currentBalance = await this.getBalance(assetId);
    if (currentBalance.lessThan(normalizedAmount)) {
      throw new ArgumentError(
        `Insufficient funds: ${normalizedAmount} requested, but only ${currentBalance} available`,
      );
    }

    const createTransferRequest = {
      amount: asset.toAtomicAmount(normalizedAmount).toString(),
      network_id: destinationNetworkId,
      asset_id: asset.primaryDenomination(),
      destination: destinationAddress,
      gasless: gasless,
    };

    const response = await Coinbase.apiClients.transfer!.createTransfer(
      this.getWalletId(),
      this.getId(),
      createTransferRequest,
    );

    const transfer = Transfer.fromModel(response.data);

    if (Coinbase.useServerSigner) {
      return transfer;
    }

    await transfer.sign(this.getSigner());
    await transfer.broadcast();

    return transfer;
  }

  /**
   * Gets a signer for the private key.
   *
   * @returns The signer for the private key.
   * @throws {Error} If the private key is not loaded.
   */
  private getSigner(): ethers.Wallet {
    if (!this.key) {
      throw new Error("Cannot sign without a private key");
    }
    return new ethers.Wallet(this.key.privateKey);
  }

  /**
   * Trades the given amount of the given Asset for another Asset. Only same-network Trades are supported.
   *
   * @param options - The options to create the Trade.
   * @param options.amount - The amount of the From Asset to send.
   * @param options.fromAssetId - The ID of the Asset to trade from.
   * @param options.toAssetId - The ID of the Asset to trade to.
   * @returns The Trade object.
   * @throws {APIError} if the API request to create or broadcast a Trade fails.
   * @throws {Error} if the Trade times out.
   */
  public async createTrade({ amount, fromAssetId, toAssetId }: CreateTradeOptions): Promise<Trade> {
    const fromAsset = await Asset.fetch(this.getNetworkId(), fromAssetId);
    const toAsset = await Asset.fetch(this.getNetworkId(), toAssetId);

    await this.validateCanTrade(amount, fromAssetId);

    const trade = await this.createTradeRequest(amount, fromAsset, toAsset);

    if (Coinbase.useServerSigner) {
      return trade;
    }

    await trade.sign(this.getSigner());
    await trade.broadcast();

    return trade;
  }

  /**
   * Creates a staking operation to stake.
   *
   * @param amount - The amount to stake.
   * @param assetId - The asset to stake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the stake operation:
   *
   * A. Shared ETH Staking
   *  - `integrator_contract_address` (optional): The contract address to which the stake operation is directed to. Defaults to the integrator contract address associated with CDP account (if available) or else defaults to a shared integrator contract address for that network.
   *
   * B. Dedicated ETH Staking
   *  - `funding_address` (optional): Ethereum address for funding the stake operation. Defaults to the address initiating the stake operation.
   *  - `withdrawal_address` (optional): Ethereum address for receiving rewards and withdrawal funds. Defaults to the address initiating the stake operation.
   *  - `fee_recipient_address` (optional): Ethereum address for receiving transaction fees. Defaults to the address initiating the stake operation.
   *
   * @param timeoutSeconds - The amount to wait for the transaction to complete when broadcasted.
   * @param intervalSeconds - The amount to check each time for a successful broadcast.
   * @returns The staking operation after it's completed successfully.
   */
  public async createStake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
    timeoutSeconds = 600,
    intervalSeconds = 0.2,
  ): Promise<StakingOperation> {
    await this.validateCanStake(amount, assetId, mode, options);
    return this.createStakingOperation(
      amount,
      assetId,
      "stake",
      mode,
      options,
      timeoutSeconds,
      intervalSeconds,
    );
  }

  /**
   * Creates a staking operation to unstake.
   *
   * @param amount - The amount to unstake.
   * @param assetId - The asset to unstake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the unstake operation:
   *
   * A. Shared ETH Staking
   *  - `integrator_contract_address` (optional): The contract address to which the unstake operation is directed to. Defaults to the integrator contract address associated with CDP account (if available) or else defaults to a shared integrator contract address for that network.
   *
   * B. Dedicated ETH Staking
   *  - `immediate` (optional): Set this to "true" to unstake immediately i.e. leverage "Coinbase managed unstake" process . Defaults to "false" i.e. "User managed unstake" process.
   *  - `validator_pub_keys` (optional): List of comma separated validator public keys to unstake. Defaults to validators being picked up on your behalf corresponding to the unstake amount.
   *
   * @param timeoutSeconds - The amount to wait for the transaction to complete when broadcasted.
   * @param intervalSeconds - The amount to check each time for a successful broadcast.
   * @returns The staking operation after it's completed successfully.
   */
  public async createUnstake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
    timeoutSeconds = 600,
    intervalSeconds = 0.2,
  ): Promise<StakingOperation> {
    await this.validateCanUnstake(amount, assetId, mode, options);
    return this.createStakingOperation(
      amount,
      assetId,
      "unstake",
      mode,
      options,
      timeoutSeconds,
      intervalSeconds,
    );
  }

  /**
   * Creates a staking operation to claim stake.
   *
   * @param amount - The amount to claim stake.
   * @param assetId - The asset to claim stake.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options for the claim stake operation.
   *
   * A. Shared ETH Staking
   *  - `integrator_contract_address` (optional): The contract address to which the claim stake operation is directed to. Defaults to the integrator contract address associated with CDP account (if available) or else defaults to a shared integrator contract address for that network.
   *
   * @param timeoutSeconds - The amount to wait for the transaction to complete when broadcasted.
   * @param intervalSeconds - The amount to check each time for a successful broadcast.
   * @returns The staking operation after it's completed successfully.
   */
  public async createClaimStake(
    amount: Amount,
    assetId: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
    timeoutSeconds = 600,
    intervalSeconds = 0.2,
  ): Promise<StakingOperation> {
    await this.validateCanClaimStake(amount, assetId, mode, options);
    return this.createStakingOperation(
      amount,
      assetId,
      "claim_stake",
      mode,
      options,
      timeoutSeconds,
      intervalSeconds,
    );
  }

  /**
   * Returns the address and network ID of the given destination.
   *
   * @param destination - The destination to get the address and network ID of.
   * @returns The address and network ID of the destination.
   */
  private getDestinationAddressAndNetwork(destination: Destination): [string, string] {
    if (typeof destination !== "string" && destination.getNetworkId() !== this.getNetworkId()) {
      throw new ArgumentError("Transfer must be on the same Network");
    }
    if (destination instanceof WalletClass) {
      return [destination.getDefaultAddress()!.getId(), destination.getNetworkId()];
    }
    if (destination instanceof Address) {
      return [destination.getId(), destination.getNetworkId()];
    }
    return [destination, this.getNetworkId()];
  }

  /**
   * Creates a trade model for the specified amount and assets.
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAsset - The Asset to trade from.
   * @param toAsset - The Asset to trade to.
   * @returns A promise that resolves to a Trade object representing the new trade.
   */
  private async createTradeRequest(
    amount: Amount,
    fromAsset: Asset,
    toAsset: Asset,
  ): Promise<Trade> {
    const tradeRequestPayload = {
      amount: fromAsset.toAtomicAmount(new Decimal(amount.toString())).toString(),
      from_asset_id: fromAsset.primaryDenomination(),
      to_asset_id: toAsset.primaryDenomination(),
    };
    const tradeModel = await Coinbase.apiClients.trade!.createTrade(
      this.getWalletId(),
      this.getId(),
      tradeRequestPayload,
    );
    return new Trade(tradeModel?.data);
  }

  /**
   * Checks if trading is possible and raises an error if not.
   *
   * @param amount - The amount of the Asset to send.
   * @param fromAssetId - The ID of the Asset to trade from. For Ether, eth, gwei, and wei are supported.
   * @throws {Error} If the private key is not loaded, or if the asset IDs are unsupported, or if there are insufficient funds.
   */
  private async validateCanTrade(amount: Amount, fromAssetId: string) {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot trade from address without private key loaded");
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
   * Creates a staking operation to stake, signs it, and broadcasts it on the blockchain.
   *
   * @param amount - The amount for the staking operation.
   * @param assetId - The asset to the staking operation.
   * @param action - The type of staking action to perform.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options such as setting the mode for the staking action.
   * @param timeoutSeconds - The amount to wait for the transaction to complete when broadcasted.
   * @param intervalSeconds - The amount to check each time for a successful broadcast.
   * @throws {APIError} if the API request to create or broadcast staking operation fails.
   * @throws {Error} if the amount is less than zero.
   * @returns The staking operation after it's completed fully.
   */
  private async createStakingOperation(
    amount: Amount,
    assetId: string,
    action: string,
    mode: StakeOptionsMode,
    options: { [key: string]: string },
    timeoutSeconds: number,
    intervalSeconds: number,
  ): Promise<StakingOperation> {
    if (new Decimal(amount.toString()).lessThanOrEqualTo(0)) {
      throw new Error("Amount required greater than zero.");
    }

    let stakingOperation = await this.createStakingOperationRequest(
      amount,
      assetId,
      action,
      mode,
      options,
    );

    const startTime = Date.now();

    // Loop until the timeout is reached.
    while (Date.now() - startTime < timeoutSeconds * 1000) {
      // Loop through any unsigned transactions that are available, sign and broadcast them.
      for (let i = 0; i < stakingOperation.getTransactions().length; i++) {
        const transaction = stakingOperation.getTransactions()[i];

        if (!transaction.isSigned()) {
          await transaction.sign(this.key!);

          stakingOperation = await this.broadcastStakingOperationRequest(
            stakingOperation.getID(),
            transaction.getSignedPayload()!.slice(2),
            i,
          );
        }
      }

      await stakingOperation.reload();

      if (stakingOperation.isTerminalState()) {
        return stakingOperation;
      }

      await delay(intervalSeconds);
    }

    throw new Error("Staking Operation timed out");
  }

  /**
   * A helper function that creates the staking operation.
   *
   * @param amount - The amount for the staking operation.
   * @param assetId - The asset for the staking operation.
   * @param action - The type of staking action to perform.
   * @param mode - The staking mode. Defaults to DEFAULT.
   * @param options - Additional options such as setting the mode for the staking action.
   * @private
   * @throws {APIError} if the API request to create staking operation fails.
   * @returns The created staking operation.
   */
  private async createStakingOperationRequest(
    amount: Amount,
    assetId: string,
    action: string,
    mode: StakeOptionsMode = StakeOptionsMode.DEFAULT,
    options: { [key: string]: string } = {},
  ): Promise<StakingOperation> {
    const asset = await Asset.fetch(this.getNetworkId(), assetId);

    options.amount = asset.toAtomicAmount(new Decimal(amount.toString())).toString();
    options.mode = mode ? mode : StakeOptionsMode.DEFAULT;

    const stakingOperationRequest = {
      network_id: this.getNetworkId(),
      asset_id: Asset.primaryDenomination(assetId),
      action: action,
      options: options,
    };

    const response = await Coinbase.apiClients.walletStake!.createStakingOperation(
      this.getWalletId(),
      this.getId(),
      stakingOperationRequest,
    );

    return new StakingOperation(response!.data);
  }

  /**
   * A helper function that broadcasts the signed payload.
   *
   * @param stakingOperationID - The staking operation id related to the signed payload.
   * @param signedPayload - The payload that's being broadcasted.
   * @param transactionIndex - The index of the transaction in the array from the staking operation.
   * @private
   * @returns An updated staking operation with the broadcasted transaction.
   */
  private async broadcastStakingOperationRequest(
    stakingOperationID: string,
    signedPayload: string,
    transactionIndex: number,
  ): Promise<StakingOperation> {
    const broadcastStakingOperationRequest = {
      signed_payload: signedPayload,
      transaction_index: transactionIndex,
    };

    const response = await Coinbase.apiClients.walletStake!.broadcastStakingOperation(
      this.getWalletId(),
      this.getId(),
      stakingOperationID,
      broadcastStakingOperationRequest,
    );

    return new StakingOperation(response.data);
  }
}

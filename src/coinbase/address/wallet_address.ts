import { Decimal } from "decimal.js";
import { ethers } from "ethers";
import { Address as AddressModel, SmartContractType } from "../../client";
import { Address } from "../address";
import { Asset } from "../asset";
import { Coinbase } from "../coinbase";
import { ArgumentError } from "../errors";
import { Trade } from "../trade";
import { Transfer } from "../transfer";
import { ContractInvocation } from "../contract_invocation";
import {
  Amount,
  CreateContractInvocationOptions,
  CreateCustomContractOptions,
  CreateERC1155Options,
  CreateERC20Options,
  CreateERC721Options,
  CreateFundOptions,
  CreateQuoteOptions,
  CreateTradeOptions,
  CreateTransferOptions,
  Destination,
  PaginationOptions,
  PaginationResponse,
  StakeOptionsMode,
} from "../types";
import { delay } from "../utils";
import { Wallet as WalletClass } from "../wallet";
import { IsDedicatedEthUnstakeV2Operation, StakingOperation } from "../staking_operation";
import { PayloadSignature } from "../payload_signature";
import { SmartContract } from "../smart_contract";
import { FundOperation } from "../fund_operation";
import { FundQuote } from "../fund_quote";

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
   * Exports the Address's private key to a hex string.
   *
   * @returns The Address's private key as a hex string.
   */
  public export() {
    if (this.key === undefined) {
      throw new Error("Private key is not set");
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
   * @param options - The pagination options.
   * @param options.limit - The maximum number of Trades to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Trades. Don\&#39;t include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns The paginated list response of trades.
   */
  public async listTrades({
    limit = Coinbase.defaultPageLimit,
    page = undefined,
  }: PaginationOptions = {}): Promise<PaginationResponse<Trade>> {
    const data: Trade[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.trade!.listTrades(
      this.model.wallet_id,
      this.model.address_id,
      limit,
      page,
    );

    response.data.data.forEach(tradeModel => {
      data.push(new Trade(tradeModel));
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
   * Returns all the transfers associated with the address.
   *
   * @param options - The pagination options.
   * @param options.limit - The maximum number of Transfers to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Transfers. Don\&#39;t include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns The paginated list response of transfers.
   */
  public async listTransfers({
    limit = Coinbase.defaultPageLimit,
    page = undefined,
  }: PaginationOptions = {}): Promise<PaginationResponse<Transfer>> {
    const data: Transfer[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.transfer!.listTransfers(
      this.model.wallet_id,
      this.model.address_id,
      limit,
      page,
    );

    response.data.data.forEach(transferModel => {
      data.push(Transfer.fromModel(transferModel));
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
   * @param options.skipBatching - When true, the Transfer will be submitted immediately. Otherwise, the Transfer will be batched. Defaults to false. Note: requires gasless option to be set to true.
   * @returns The transfer object.
   * @throws {APIError} if the API request to create a Transfer fails.
   * @throws {APIError} if the API request to broadcast a Transfer fails.
   */
  public async createTransfer({
    amount,
    assetId,
    destination,
    gasless = false,
    skipBatching = false,
  }: CreateTransferOptions): Promise<Transfer> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot transfer from address without private key loaded");
    }
    const asset = await Asset.fetch(this.getNetworkId(), assetId);
    const [destinationAddress, destinationNetworkId] =
      await this.getDestinationAddressAndNetwork(destination);

    const normalizedAmount = new Decimal(amount.toString());
    const currentBalance = await this.getBalance(assetId);
    if (currentBalance.lessThan(normalizedAmount)) {
      throw new ArgumentError(
        `Insufficient funds: ${normalizedAmount} requested, but only ${currentBalance} available`,
      );
    }

    if (skipBatching && !gasless) {
      throw new ArgumentError("skipBatching requires gasless to be true");
    }

    const createTransferRequest = {
      amount: asset.toAtomicAmount(normalizedAmount).toString(),
      network_id: destinationNetworkId,
      asset_id: asset.primaryDenomination(),
      destination: destinationAddress,
      gasless: gasless,
      skip_batching: skipBatching,
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
   * Invokes a contract with the given data.
   *
   * @param options - The options to invoke the contract
   * @param options.contractAddress - The address of the contract the method will be invoked on.
   * @param options.method - The method to invoke on the contract.
   * @param options.abi - The ABI of the contract.
   * @param options.args - The arguments to pass to the contract method invocation.
   *   The keys should be the argument names and the values should be the argument values.
   * @param options.amount - The amount of the asset to send to a payable contract method.
   * @param options.assetId - The ID of the asset to send to a payable contract method.
   *   The asset must be a denomination of the native asset. (Ex. "wei", "gwei", or "eth").
   * @returns The ContractInvocation object.
   * @throws {APIError} if the API request to create a contract invocation fails.
   * @throws {Error} if the address cannot sign.
   * @throws {ArgumentError} if the address does not have sufficient balance.
   */
  public async invokeContract({
    contractAddress,
    method,
    abi,
    args,
    amount,
    assetId,
  }: CreateContractInvocationOptions): Promise<ContractInvocation> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot invoke contract from address without private key loaded");
    }

    if (amount && !assetId) {
      throw new ArgumentError(
        "Asset ID is required for contract ivocation if an amount is provided",
      );
    }

    let atomicAmount: string | undefined;

    if (assetId && amount) {
      const asset = await Asset.fetch(this.getNetworkId(), assetId);
      const normalizedAmount = new Decimal(amount.toString());
      const currentBalance = await this.getBalance(assetId);
      if (currentBalance.lessThan(normalizedAmount)) {
        throw new ArgumentError(
          `Insufficient funds: ${normalizedAmount} requested, but only ${currentBalance} available`,
        );
      }
      atomicAmount = asset.toAtomicAmount(normalizedAmount).toString();
    }

    const contractInvocation = await this.createContractInvocation(
      contractAddress,
      method,
      abi!,
      args,
      atomicAmount,
    );

    if (Coinbase.useServerSigner) {
      return contractInvocation;
    }

    await contractInvocation.sign(this.getSigner());
    await contractInvocation.broadcast();

    return contractInvocation;
  }

  /**
   * Deploys an ERC20 token contract.
   *
   * @param options - The options for creating the ERC20 token.
   * @param options.name - The name of the ERC20 token.
   * @param options.symbol - The symbol of the ERC20 token.
   * @param options.totalSupply - The total supply of the ERC20 token.
   * @returns A Promise that resolves to the deployed SmartContract object.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  public async deployToken({
    name,
    symbol,
    totalSupply,
  }: CreateERC20Options): Promise<SmartContract> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot deploy ERC20 without private key loaded");
    }

    const smartContract = await this.createERC20({ name, symbol, totalSupply });

    if (Coinbase.useServerSigner) {
      return smartContract;
    }

    await smartContract.sign(this.getSigner());
    await smartContract.broadcast();

    return smartContract;
  }

  /**
   * Deploys an ERC721 token contract.
   *
   * @param options - The options for creating the ERC721 token.
   * @param options.name - The name of the ERC721 token.
   * @param options.symbol - The symbol of the ERC721 token.
   * @param options.baseURI - The base URI of the ERC721 token.
   * @returns A Promise that resolves to the deployed SmartContract object.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  public async deployNFT({ name, symbol, baseURI }: CreateERC721Options): Promise<SmartContract> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot deploy ERC721 without private key loaded");
    }

    const smartContract = await this.createERC721({ name, symbol, baseURI });

    if (Coinbase.useServerSigner) {
      return smartContract;
    }

    await smartContract.sign(this.getSigner());
    await smartContract.broadcast();

    return smartContract;
  }

  /**
   * Deploys an ERC1155 multi-token contract.
   *
   * @param options - The options for creating the ERC1155 token.
   * @param options.uri - The URI for all token metadata.
   * @returns A Promise that resolves to the deployed SmartContract object.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  public async deployMultiToken({ uri }: CreateERC1155Options): Promise<SmartContract> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot deploy ERC1155 without private key loaded");
    }

    const smartContract = await this.createERC1155({ uri });

    if (Coinbase.useServerSigner) {
      return smartContract;
    }

    await smartContract.sign(this.getSigner());
    await smartContract.broadcast();

    return smartContract;
  }

  /**
   * Deploys a custom contract.
   *
   * @param options - The options for creating the custom contract.
   * @param options.solidityVersion - The version of the solidity compiler, must be 0.8.+, such as "0.8.28+commit.7893614a". See https://binaries.soliditylang.org/bin/list.json
   * @param options.solidityInputJson - The input json for the solidity compiler. See https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description for more details.
   * @param options.contractName - The name of the contract class to be deployed.
   * @param options.constructorArgs - The arguments for the constructor.
   * @returns A Promise that resolves to the deployed SmartContract object.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  public async deployContract({
    solidityVersion,
    solidityInputJson,
    contractName,
    constructorArgs,
  }: CreateCustomContractOptions): Promise<SmartContract> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot deploy custom contract without private key loaded");
    }

    const smartContract = await this.createCustomContract({
      solidityVersion,
      solidityInputJson,
      contractName,
      constructorArgs,
    });

    if (Coinbase.useServerSigner) {
      return smartContract;
    }

    await smartContract.sign(this.getSigner());
    await smartContract.broadcast();

    return smartContract;
  }

  /**
   * Creates an ERC20 token contract.
   *
   * @private
   * @param {CreateERC20Options} options - The options for creating the ERC20 token.
   * @param {string} options.name - The name of the ERC20 token.
   * @param {string} options.symbol - The symbol of the ERC20 token.
   * @param {BigNumber} options.totalSupply - The total supply of the ERC20 token.
   * @returns {Promise<SmartContract>} A Promise that resolves to the created SmartContract.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  private async createERC20({
    name,
    symbol,
    totalSupply,
  }: CreateERC20Options): Promise<SmartContract> {
    const resp = await Coinbase.apiClients.smartContract!.createSmartContract(
      this.getWalletId(),
      this.getId(),
      {
        type: SmartContractType.Erc20,
        options: {
          name,
          symbol,
          total_supply: totalSupply.toString(),
        },
      },
    );
    return SmartContract.fromModel(resp?.data);
  }

  /**
   * Creates an ERC721 token contract.
   *
   * @param options - The options for creating the ERC721 token.
   * @param options.name - The name of the ERC721 token.
   * @param options.symbol - The symbol of the ERC721 token.
   * @param options.baseURI - The base URI of the ERC721 token.
   * @returns A Promise that resolves to the deployed SmartContract object.
   * @throws {APIError} If the private key is not loaded when not using server signer.
   */
  private async createERC721({
    name,
    symbol,
    baseURI,
  }: CreateERC721Options): Promise<SmartContract> {
    const resp = await Coinbase.apiClients.smartContract!.createSmartContract(
      this.getWalletId(),
      this.getId(),
      {
        type: SmartContractType.Erc721,
        options: {
          name,
          symbol,
          base_uri: baseURI,
        },
      },
    );
    return SmartContract.fromModel(resp?.data);
  }

  /**
   * Creates an ERC1155 multi-token contract.
   *
   * @private
   * @param {CreateERC1155Options} options - The options for creating the ERC1155 token.
   * @param {string} options.uri - The URI for all token metadata.
   * @returns {Promise<SmartContract>} A Promise that resolves to the created SmartContract.
   * @throws {APIError} If the API request to create a smart contract fails.
   */
  private async createERC1155({ uri }: CreateERC1155Options): Promise<SmartContract> {
    const resp = await Coinbase.apiClients.smartContract!.createSmartContract(
      this.getWalletId(),
      this.getId(),
      {
        type: SmartContractType.Erc1155,
        options: {
          uri,
        },
      },
    );
    return SmartContract.fromModel(resp?.data);
  }

  /**
   * Creates a custom contract.
   *
   * @private
   * @param {CreateCustomContractOptions} options - The options for creating the custom contract.
   * @param {string} options.solidityVersion - The version of the solidity compiler, must be 0.8.+, such as "0.8.28+commit.7893614a". See https://binaries.soliditylang.org/bin/list.json
   * @param {string} options.solidityInputJson - The input json for the solidity compiler. See https://docs.soliditylang.org/en/latest/using-the-compiler.html#input-description for more details.
   * @param {string} options.contractName - The name of the contract class.
   * @param {Record<string, any>} options.constructorArgs - The arguments for the constructor.
   * @returns {Promise<SmartContract>} A Promise that resolves to the created SmartContract.
   * @throws {APIError} If the API request to compile or subsequently create a smart contract fails.
   */
  private async createCustomContract({
    solidityVersion,
    solidityInputJson,
    contractName,
    constructorArgs,
  }: CreateCustomContractOptions): Promise<SmartContract> {
    const compileContractResp = await Coinbase.apiClients.smartContract!.compileSmartContract({
      solidity_compiler_version: solidityVersion,
      solidity_input_json: solidityInputJson,
      contract_name: contractName,
    });

    const compiledContract = compileContractResp.data;
    const compiledContractId = compiledContract.compiled_smart_contract_id;

    const createContractResp = await Coinbase.apiClients.smartContract!.createSmartContract(
      this.getWalletId(),
      this.getId(),
      {
        type: SmartContractType.Custom,
        options: JSON.stringify(constructorArgs),
        compiled_smart_contract_id: compiledContractId,
      },
    );
    return SmartContract.fromModel(createContractResp?.data);
  }

  /**
   * Creates a contract invocation with the given data.
   *
   * @param contractAddress - The address of the contract the method will be invoked on.
   * @param method - The method to invoke on the contract.
   * @param abi - The ABI of the contract.
   * @param args - The arguments to pass to the contract method invocation.
   *   The keys should be the argument names and the values should be the argument values.
   * @param atomicAmount - The atomic amount of the native asset to send to a payable contract method.
   * @returns The ContractInvocation object.
   * @throws {APIError} if the API request to create a contract invocation fails.
   */
  private async createContractInvocation(
    contractAddress: string,
    method: string,
    abi: object,
    args: object,
    atomicAmount?: string,
  ): Promise<ContractInvocation> {
    const resp = await Coinbase.apiClients.contractInvocation!.createContractInvocation(
      this.getWalletId(),
      this.getId(),
      {
        method: method,
        abi: JSON.stringify(abi),
        contract_address: contractAddress,
        args: JSON.stringify(args),
        amount: atomicAmount,
      },
    );

    return ContractInvocation.fromModel(resp?.data);
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
    // If performing a native ETH unstake, validation is always performed server-side.
    if (!IsDedicatedEthUnstakeV2Operation(assetId, "unstake", mode, options)) {
      await this.validateCanUnstake(amount, assetId, mode, options);
    }
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
   * Creates a staking operation to consolidate.
   *
   * @param options - Additional options for the consolidation operation.
   *
   * @param timeoutSeconds - The amount to wait for the transaction to complete when broadcasted.
   * @param intervalSeconds - The amount to check each time for a successful broadcast.
   *
   * @returns The staking operation after it's completed successfully.
   */
  public async createValidatorConsolidation(
    options: { [key: string]: string } = {},
    timeoutSeconds = 600,
    intervalSeconds = 0.2,
  ): Promise<StakingOperation> {
    return this.createStakingOperation(
      0,
      "eth",
      "consolidate",
      StakeOptionsMode.NATIVE,
      options,
      timeoutSeconds,
      intervalSeconds,
    );
  }

  /**
   * Creates a Payload Signature.
   *
   * @param unsignedPayload - The Unsigned Payload to sign.
   * @returns A promise that resolves to the Payload Signature object.
   * @throws {APIError} if the API request to create a Payload Signature fails.
   * @throws {Error} if the address does not have a private key loaded or an associated Server-Signer.
   */
  public async createPayloadSignature(unsignedPayload: string): Promise<PayloadSignature> {
    if (!Coinbase.useServerSigner && !this.key) {
      throw new Error("Cannot sign payload with address without private key loaded");
    }

    let signature: undefined | string = undefined;
    if (!Coinbase.useServerSigner) {
      signature = this.key!.signingKey.sign(unsignedPayload).serialized;
    }

    const createPayloadSignatureRequest = {
      unsigned_payload: unsignedPayload,
      signature,
    };

    const response = await Coinbase.apiClients.address!.createPayloadSignature(
      this.getWalletId(),
      this.getId(),
      createPayloadSignatureRequest,
    );

    const payloadSignature = new PayloadSignature(response.data);

    return payloadSignature;
  }

  /**
   * Gets a Payload Signature.
   *
   * @param payloadSignatureId - The ID of the Payload Signature to fetch.
   * @returns A promise that resolves to the Payload Signature object.
   * @throws {APIError} if the API request to get the Payload Signature fails.
   */
  public async getPayloadSignature(payloadSignatureId: string): Promise<PayloadSignature> {
    const response = await Coinbase.apiClients.address!.getPayloadSignature(
      this.getWalletId(),
      this.getId(),
      payloadSignatureId,
    );

    const payloadSignature = new PayloadSignature(response.data);

    return payloadSignature;
  }

  /**
   * Lists all the Payload Signatures associated with the Address.
   *
   * @param options - The pagination options.
   * @param options.limit - The maximum number of Payload Signatures to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Payload Signatures. Don\&#39;t include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns A promise that resolves to the paginated list response of Payload Signatures.
   * @throws {APIError} if the API request to list the Payload Signatures fails.
   */
  public async listPayloadSignatures({
    limit = Coinbase.defaultPageLimit,
    page = undefined,
  }: PaginationOptions = {}): Promise<PaginationResponse<PayloadSignature>> {
    const data: PayloadSignature[] = [];
    let nextPage: string | undefined;

    const response = await Coinbase.apiClients.address!.listPayloadSignatures(
      this.model.wallet_id,
      this.model.address_id,
      100,
      page?.length ? page : undefined,
    );

    response.data.data.forEach(payloadSignatureModel => {
      data.push(new PayloadSignature(payloadSignatureModel));
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
   * Fund the address from your account on the Coinbase Platform.
   *
   * @param options - The options to create the fund operation
   * @param options.amount - The amount of the Asset to fund the wallet with
   * @param options.assetId - The ID of the Asset to fund with. For Ether, eth, gwei, and wei are supported.
   * @returns The created fund operation object
   */
  public async fund({ amount, assetId }: CreateFundOptions): Promise<FundOperation> {
    const normalizedAmount = new Decimal(amount.toString());

    return FundOperation.create(
      this.getWalletId(),
      this.getId(),
      normalizedAmount,
      assetId,
      this.getNetworkId(),
    );
  }

  /**
   * Get a quote for funding the address from your Coinbase platform account.
   *
   * @param options - The options to create the fund quote
   * @param options.amount - The amount to fund
   * @param options.assetId - The ID of the Asset to fund with. For Ether, eth, gwei, and wei are supported.
   * @returns The fund quote object
   */
  public async quoteFund({ amount, assetId }: CreateQuoteOptions): Promise<FundQuote> {
    const normalizedAmount = new Decimal(amount.toString());

    return FundQuote.create(
      this.getWalletId(),
      this.getId(),
      normalizedAmount,
      assetId,
      this.getNetworkId(),
    );
  }

  /**
   * Returns all the fund operations associated with the address.
   *
   * @param options - The pagination options.
   * @param options.limit - The maximum number of Fund Operations to return. Limit can range between 1 and 100.
   * @param options.page - The cursor for pagination across multiple pages of Fund Operations. Don't include this parameter on the first call. Use the next page value returned in a previous response to request subsequent results.
   *
   * @returns The paginated list response of fund operations.
   */
  public async listFundOperations({
    limit = Coinbase.defaultPageLimit,
    page = undefined,
  }: PaginationOptions = {}): Promise<PaginationResponse<FundOperation>> {
    return FundOperation.listFundOperations(this.model.wallet_id, this.model.address_id, {
      limit,
      page,
    });
  }

  /**
   * Returns the address and network ID of the given destination.
   *
   * @param destination - The destination to get the address and network ID of.
   * @returns The address and network ID of the destination.
   */
  private async getDestinationAddressAndNetwork(
    destination: Destination,
  ): Promise<[string, string]> {
    if (typeof destination !== "string" && destination.getNetworkId() !== this.getNetworkId()) {
      throw new ArgumentError("Transfer must be on the same Network");
    }
    if (destination instanceof WalletClass) {
      return [(await destination.getDefaultAddress()).getId(), destination.getNetworkId()];
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

    options.mode = mode ? mode : StakeOptionsMode.DEFAULT;

    options.amount = asset.toAtomicAmount(new Decimal(amount.toString())).toString();

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

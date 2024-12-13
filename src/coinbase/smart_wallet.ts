import { Decimal } from "decimal.js";
import { TransactionStatus } from "./types";
import { Transaction } from "./transaction";
import { Coinbase } from "./coinbase";
import { CreateSmartTransferRequest, SmartWallet as SmartWalletModel } from "../client/api";
import { ethers } from "ethers";
import { delay } from "./utils";
import { TimeoutError } from "./errors";
import { Wallet } from "./wallet";
import { ContractInvocation } from "./contract_invocation";
import { Transfer } from "./transfer";
import { WalletAddress } from "./address/wallet_address";
import { sign, SignReturnType } from "viem/accounts";
import { encodeAbiParameters, encodePacked, Hex } from "viem";


const SignatureWrapperStruct = {
    components: [
      {
        name: "ownerIndex",
        type: "uint256",
      },
      {
        name: "signatureData",
        type: "bytes",
      },
    ],
    name: "SignatureWrapper",
    type: "tuple",
};

/**
 * A representation of a SmartWallet, which is a smart wallet onchain.
 */
export class SmartWallet {
  private smart_wallet_id: string;
  private contractInvocation: ContractInvocation;
  private contractAddress: string;
  private address: WalletAddress;
  /**
   * Private constructor to prevent direct instantiation outside of the factory methods.
   *
   * @ignore
   * @param smartWalletModel - The SmartWallet model.
   * @hideconstructor
   */
  private constructor(smartWalletModel: SmartWalletModel, address: WalletAddress) {
    this.smart_wallet_id = smartWalletModel.smart_wallet_id;
    this.contractInvocation = ContractInvocation.fromModel(smartWalletModel.contractInvocation!);
    this.contractAddress = smartWalletModel.smart_wallet_address;
    this.address = address;
  }

  /**
   * Creates a SmartWallet.
   *
   * @returns The SmartWallet object
   */
  public static async create(signer?: WalletAddress): Promise<SmartWallet> {
    if (!signer) {
        const wallet = await Wallet.import({
            walletId: 'bfdcec50-f794-4038-8784-5c51b62cffbc',
            seed: '33de606bb16a886b1a5dd008d2ef2fac841fd0fe7b3f6a81326a295ec8294271'
          })    
          const address = await wallet.getDefaultAddress();
          console.log("Address:", address);

        // // create a wallet
        // const wallet = await Wallet.create();

        // // use the default address of the wallet
        // const address = await wallet.getDefaultAddress();

        // // faucet the address
        // const faucet_tx = await address.faucet();
        // await faucet_tx.wait();

        // // view balance
        // const balance = await address.getBalance("eth");
        // console.log("Balance:", balance);

        // // log address
        // console.log("Deployer and owner of smart wallet:", address);

        const resp = await Coinbase.apiClients.smartWallet!.createSmartWallet(
            wallet.getId()!,
            address.getId(),
        );

        // log smart wallet
        const smartWallet = SmartWallet.fromModel(resp?.data, address);
        console.log("Smart wallet:", JSON.stringify(smartWallet, null, 2));

        if (Coinbase.useServerSigner) {
            return smartWallet;
        }
    
        await smartWallet.sign(address.getSigner());
        await smartWallet.broadcast();
        return smartWallet;
    } else {
        console.log("Deployer and owner of smart wallet:", signer);
        const resp = await Coinbase.apiClients.smartWallet!.createSmartWallet(
            signer.getWalletId(),
            signer.getId(),
        );
        const smartWallet = SmartWallet.fromModel(resp?.data, signer);
        if (Coinbase.useServerSigner) {
            return smartWallet;
        }
        await smartWallet.sign(signer.getSigner());
        await smartWallet.broadcast();
        return smartWallet;
    }
  }

  /**
   * Creates a Smart Transfer.
   *
   * @param smartWalletId - The ID of the wallet the source address belongs to.
   * @param createSmartTransferRequest - The request body.
   * @param options - Axios request options.
   * @returns - A promise resolving to the Transfer model.
   * @throws {APIError} If the request fails.
   */
  public async createSmartTransfer(createSmartTransferRequest: CreateSmartTransferRequest): Promise<undefined> { // TODO - create a SmartTransfer class to wrap model, need to change cdp-service response type first
    const response = await Coinbase.apiClients.transfer!.createSmartTransfer(
      this.getId(),
      createSmartTransferRequest,
    );
    const preparedCallsResponse = response.data;
    console.log("Smart transfer response hash:", preparedCallsResponse);

    // decode string to json
    let preparedCalls = JSON.parse(preparedCallsResponse) as {
        type: string;
        userOp: {
            sender: string;
            nonce: string;
            initCode: string;
            callData: string;
            callGasLimit: string;
            verificationGasLimit: string;
            preVerificationGas: string;
            maxFeePerGas: string;
            maxPriorityFeePerGas: string;
            paymasterAndData: string;
            signature: string;
        },
        chainId: string;
        signatureRequest: {
            hash: string;
        },
        capabilities: {
            paymasterService: string;
            walletSync: string;
        }
    }

    const key = await this.address.getSigner();
    // const signedPayload = await key!.signMessage(ethers.getBytes(preparedCalls.signatureRequest.hash));

    // // Parse the signature into r,s,v components
    // const parsedSig = ethers.Signature.from(signedPayload);
    
    // // Create the signature wrapper matching the viem implementation
    // const wrappedSignature = ethers.AbiCoder.defaultAbiCoder().encode(
    //     ["tuple(uint256 ownerIndex, bytes signatureData)"],
    //     [{
    //         ownerIndex: 0,
    //         signatureData: ethers.concat([
    //             parsedSig.r,
    //             parsedSig.s,
    //             ethers.toBeHex(parseInt(parsedSig.v.toString()), 1) // 1 byte = uint8
    //             // ethers.toBeHex(parsedSig.v)
    //         ])
    //     }]
    // );

    // TODO - these are currently different, need to switch to viem or fix ethers.

    // MY WRAPPED SIGNATUTRE
    const wrappedSignature = await this.getWrappedSignature(preparedCalls.signatureRequest.hash, key!);
    console.log("Wrapped signature:", wrappedSignature);

    const viemWrappedSignature = await this.getWrappedSignatureViem(preparedCalls.signatureRequest.hash as `0x${string}`, key!);
    console.log("Viem wrapped signature:", viemWrappedSignature);

    // TODO - these are currently different, need to switch to viem or fix ethers.

    // const wrappedSignature = ethers.AbiCoder.defaultAbiCoder().encode(
    //     ["tuple(uint256 ownerIndex, bytes signatureData)"],
    //     [{ownerIndex: 0, signatureData: signedPayload}]
    // );

    // fill the signature in the preparedCalls
    preparedCalls.userOp.signature = viemWrappedSignature;

    console.log("Smart transfer signed payload:", JSON.stringify(preparedCalls, null, 2));

    // let's broadcast the smart transfer
    const broadcastResponse = await Coinbase.apiClients.transfer!.deploySmartTransfer(
        this.getId(),
        {
            user_op: JSON.stringify(preparedCalls.userOp),
        }
    );

    console.log("Smart transfer broadcast response:", JSON.stringify(broadcastResponse, null, 2));

    return undefined;
   // return Transfer.fromModel(response.data);
  }

  async getWrappedSignature(hash: string, signer: ethers.Wallet): Promise<string> {
    const signedPayload = await signer!.signMessage(ethers.getBytes(hash));

    // Parse the signature into r,s,v components
    const parsedSig = ethers.Signature.from(signedPayload);
    
    // Create the signature wrapper matching the viem implementation
    const wrappedSignature = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(uint256 ownerIndex, bytes signatureData)"],
        [{
            ownerIndex: 0,
            signatureData: ethers.concat([
                parsedSig.r,
                parsedSig.s,
                ethers.toBeHex(parseInt(parsedSig.v.toString()), 1) // 1 byte = uint8
                // ethers.toBeHex(parsedSig.v)
            ])
        }]
    );

    return wrappedSignature;
  }

  async getWrappedSignatureViem(hash: `0x${string}`, signer: ethers.Wallet): Promise<string> {
    const signature = await sign({ hash, privateKey: signer.privateKey as Hex });
    if (!signature) {
      throw new Error("Signature is undefined");
    }
    
    const signatureWrapper = this.buildSignatureWrapperForEOA({
      signature,
      ownerIndex: 0n,
    });

    return signatureWrapper;
  }

  

  async buildSignatureWrapperForEOA(
    { signature, ownerIndex }: { signature: SignReturnType; ownerIndex: bigint },
  ) {
    if (!signature.v) {
      throw new Error("Signature is undefined");
    }

    const signatureData = encodePacked(
      ["bytes32", "bytes32", "uint8"],
      [
        signature.r,
        signature.s,
        parseInt(signature.v.toString()),
      ],
    );
    return encodeAbiParameters(
      [SignatureWrapperStruct],
      [
        {
          ownerIndex,
          signatureData,
        },
      ],
    );
  }

  /**
   * Converts a SmartWalletModel into a SmartWallet object.
   *
   * @param smartWalletModel - The SmartWallet model object.
   * @returns The SmartWallet object.
   */
  public static fromModel(smartWalletModel: SmartWalletModel, signer: WalletAddress): SmartWallet {
    return new SmartWallet(smartWalletModel, signer);
  }

  /**
   * Returns the ID of the SmartWallet.
   *
   * @returns The SmartWallet ID.
   */
  public getId(): string {
    return this.smart_wallet_id;
  }

  /**
   * Returns the Network ID of the SmartWallet.
   *
   * @returns The Network ID.
   */
  public getNetworkId(): string {
    return this.contractInvocation.getNetworkId();
  }

  /**
   * Returns the Wallet ID of the owner of the SmartWallet.
   *
   * @returns The Wallet ID.
   */
  public getWalletId(): string {
    return this.contractInvocation.getWalletId();
  }

  /**
   * Returns the From Address ID of the owner of the SmartWallet.
   *
   * @returns The From Address ID.
   */
  public getAddressId(): string {
    return this.contractInvocation.getFromAddressId();
  }

  /**
   * Returns the contract aadress of the newly deployed smart wallet.
   *
   * @returns The Destination Address ID.
   */
  public getContractAddress(): string | undefined {
    return this.contractAddress;
  }

  /**
   * Returns the Transaction Hash of the ContractInvocation.
   *
   * @returns The Transaction Hash as a Hex string, or undefined if not yet available.
   */
  public getTransactionHash(): string | undefined {
    return this.getTransaction().getTransactionHash();
  }

  /**
   * Returns the Transaction of the ContractInvocation.
   *
   * @returns The ethers.js Transaction object.
   * @throws (InvalidUnsignedPayload) If the Unsigned Payload is invalid.
   */
  public getRawTransaction(): ethers.Transaction {
    return this.getTransaction().rawTransaction();
  }

  /**
   * Signs the ContractInvocation with the provided key and returns the hex signature
   * required for broadcasting the ContractInvocation.
   *
   * @param key - The key to sign the ContractInvocation with
   * @returns The hex-encoded signed payload
   */
  async sign(key: ethers.Wallet): Promise<string> {
    return this.getTransaction().sign(key);
  }

  /**
   * Returns the Status of the SmartWallet.
   *
   * @returns The Status of the SmartWallet.
   */
  public getStatus(): TransactionStatus | undefined {
    return this.getTransaction().getStatus();
  }

  /**
   * Returns the Transaction of the SmartWallet.
   *
   * @returns The Transaction
   */
  public getTransaction(): Transaction {
    return this.contractInvocation.getTransaction();
  }

  /**
   * Returns the link to the Transaction on the blockchain explorer.
   *
   * @returns The link to the Transaction on the blockchain explorer.
   */
  public getTransactionLink(): string {
    return this.getTransaction().getTransactionLink();
  }

  /**
   * Broadcasts the SmartWallet to the Network.
   *
   * @returns The SmartWallet object
   * @throws {APIError} if the API request to broadcast a SmartWallet fails.
   */
  public async broadcast(): Promise<undefined> {
    if (!this.getTransaction()?.isSigned())
      throw new Error("Cannot broadcast unsigned SmartWallet");

    const broadcastSmartWalletRequest = {
      signed_payload: this.getTransaction()!.getSignature()!,
    };

    const response = await Coinbase.apiClients.smartWallet!.deploySmartWallet(
      this.getWalletId(),
      this.getAddressId(),
      this.getId(),
      broadcastSmartWalletRequest,
    );

    // response is unused
    return undefined;
  }

  /**
   * Waits for the ContractInvocation to be confirmed on the Network or fail on chain.
   * Waits until the ContractInvocation is completed or failed on-chain by polling at the given interval.
   * Raises an error if the ContractInvocation takes longer than the given timeout.
   *
   * @param options - The options to configure the wait function.
   * @param options.intervalSeconds - The interval to check the status of the ContractInvocation.
   * @param options.timeoutSeconds - The maximum time to wait for the ContractInvocation to be confirmed.
   *
   * @returns The ContractInvocation object in a terminal state.
   * @throws {Error} if the ContractInvocation times out.
   */
  public async wait({
    intervalSeconds = 0.2,
    timeoutSeconds = 10,
  } = {}): Promise<SmartWallet> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      await this.reload();

      // If the SmartWallet is in a terminal state, return the SmartWallet.
      const status = this.getStatus();
      if (status === TransactionStatus.COMPLETE || status === TransactionStatus.FAILED) {
        return this;
      }

      await delay(intervalSeconds);
    }

    throw new TimeoutError("SmartWallet timed out");
  }

  /**
   * Reloads the SmartWallet model with the latest data from the server.
   *
   * @throws {APIError} if the API request to get a SmartWallet fails.
   */
  public async reload(): Promise<void> {
    const result = await Coinbase.apiClients.smartWallet!.getSmartWallet(
      this.getWalletId(),
      this.getAddressId(),
      this.getId(),
    );
    this.contractInvocation = ContractInvocation.fromModel(result?.data.contractInvocation!);
  }


  /**
   * Returns a string representation of the SmartWallet.
   *
   * @returns The string representation of the SmartWallet.
   */
  public toString(): string {
    return (
      `SmartWallet{smartWalletId: '${this.getId()}', networkId: '${this.getNetworkId()}', ` +
      `addressId: '${this.getAddressId()}', contractAddress: '${this.getContractAddress()}', ` +
      `transactionLink: '${this.getTransactionLink()}', status: '${this.getStatus()}'}`
    );
  }
}


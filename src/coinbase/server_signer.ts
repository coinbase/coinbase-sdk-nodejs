import { Coinbase } from "./coinbase";
import { ServerSigner as ServerSignerModel } from "../client/api";

/**
 * A representation of a Server-Signer. Server-Signers are assigned to sign transactions for a Wallet.
 */
export class ServerSigner {
  private model: ServerSignerModel;

  /**
   * Private constructor to prevent direct instantiation outside of factory method.
   * Creates a new ServerSigner instance.
   * Do not use this method directly. Instead, use ServerSigner.getDefault().
   *
   * @ignore
   * @param serverSignerModel - The Server-Signer model.
   * @hideconstructor
   */
  private constructor(serverSignerModel: ServerSignerModel) {
    this.model = serverSignerModel;
  }

  /**
   * Returns the default Server-Signer for the CDP Project.
   *
   * @returns The default Server-Signer.
   * @throws {APIError} if the API request to list Server-Signers fails.
   * @throws {Error} if there is no Server-Signer associated with the CDP Project.
   */
  public static async getDefault(): Promise<ServerSigner> {
    const response = await Coinbase.apiClients.serverSigner!.listServerSigners();
    if (response.data.data.length === 0) {
      throw new Error("No Server-Signer is associated with the project");
    }

    return new ServerSigner(response.data.data[0]);
  }

  /**
   * Returns the ID of the Server-Signer.
   *
   * @returns The Server-Signer ID.
   */
  public getId(): string {
    return this.model.server_signer_id;
  }

  /**
   * Returns the IDs of the Wallet's the Server-Signer can sign for.
   *
   * @returns The Wallet IDs.
   */
  public getWallets(): string[] | undefined {
    return this.model.wallets;
  }

  /**
   * Returns a String representation of the Server-Signer.
   *
   * @returns a String representation of the Server-Signer.
   */
  public toString(): string {
    return `ServerSigner{id: '${this.getId()}', wallets: '${this.getWallets()}'}`;
  }
}

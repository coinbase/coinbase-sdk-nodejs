import * as crypto from "crypto";
import { Coinbase } from "../coinbase/coinbase";
import { APIError } from "../coinbase/api_error";
import { ServerSigner as ServerSignerModel, ServerSignerList } from "../client";
import { serverSignersApiMock, mockReturnValue, mockReturnRejectedValue } from "./utils";
import { ServerSigner } from "../coinbase/server_signer";

describe("ServerSigner", () => {
  let serverSigner: ServerSigner;
  const serverSignerId: string = crypto.randomUUID();
  const wallets: string[] = Array.from({ length: 3 }, () => crypto.randomUUID());
  const model: ServerSignerModel = {
    server_signer_id: serverSignerId,
    wallets: wallets,
    is_mpc: true,
  };
  const serverSignerList: ServerSignerList = {
    data: [model],
    total_count: 1,
    has_more: false,
    next_page: "",
  };
  const emptyServerSignerList: ServerSignerList = {
    data: [],
    total_count: 0,
    has_more: false,
    next_page: "",
  };

  beforeAll(async () => {
    Coinbase.apiClients.serverSigner = serverSignersApiMock;
    Coinbase.apiClients.serverSigner!.listServerSigners = mockReturnValue(serverSignerList);
    serverSigner = await ServerSigner.getDefault();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe(".getDefault", () => {
    describe("when a default Server-Signer exists", () => {
      beforeEach(() => {
        Coinbase.apiClients.serverSigner!.listServerSigners = mockReturnValue(serverSignerList);
      });

      it("should return the default Server-Signer", async () => {
        const defaultServerSigner = await ServerSigner.getDefault();
        expect(defaultServerSigner).toBeInstanceOf(ServerSigner);
        expect(defaultServerSigner.getId()).toBe(serverSignerId);
        expect(defaultServerSigner.getWallets()).toBe(wallets);
        expect(Coinbase.apiClients.serverSigner!.listServerSigners).toHaveBeenCalledTimes(1);
      });
    });

    it("should throw an APIError when the request is unsuccessful", async () => {
      Coinbase.apiClients.serverSigner!.listServerSigners = mockReturnRejectedValue(
        new APIError("Failed to list Server-Signers"),
      );
      await expect(ServerSigner.getDefault()).rejects.toThrow(APIError);
      expect(Coinbase.apiClients.serverSigner!.listServerSigners).toHaveBeenCalledTimes(1);
    });

    describe("when a default Server-Signer does not exist", () => {
      beforeEach(() => {
        Coinbase.apiClients.serverSigner!.listServerSigners =
          mockReturnValue(emptyServerSignerList);
      });

      it("should return an error", async () => {
        await expect(ServerSigner.getDefault()).rejects.toThrow(
          new Error("No Server-Signer is associated with the project"),
        );
      });
    });
  });

  describe("#getId", () => {
    it("should return the Server-Signer ID", async () => {
      expect(serverSigner.getId()).toBe(serverSignerId);
    });
  });

  describe("#getWallets", () => {
    it("should return the list of Wallet IDs", async () => {
      expect(serverSigner.getWallets()).toBe(wallets);
    });
  });

  describe("#toString", () => {
    it("should return the correct string representation", async () => {
      expect(serverSigner.toString()).toBe(
        `ServerSigner{id: '${serverSignerId}', wallets: '${wallets}'}`,
      );
    });
  });

  describe("#toJSON", () => {
    it("should return the correct JSON representation", async () => {
      expect(serverSigner.toJSON()).toEqual({
        id: serverSignerId,
        wallets: wallets,
      });
    });
  });
});

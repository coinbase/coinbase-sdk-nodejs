import { ApiClients } from "./types";

export class User {
  private userId: string = "";
  private client: ApiClients;

  constructor(userId: string, client: ApiClients) {
    this.userId = userId;
    this.client = client;
  }

  public getUserId(): string {
    return this.userId;
  }

  toString(): string {
    return `Coinbase:User{userId: ${this.userId}}`;
  }
}

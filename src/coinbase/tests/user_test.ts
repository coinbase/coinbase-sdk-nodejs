import { User } from "./../user";
import { InternalError } from "./../errors";
import { ApiClients } from "./../types";

describe("User", () => {
  let mockApiClients: ApiClients;

  beforeEach(() => {
    mockApiClients = {} as ApiClients;
  });

  it("should create a User instance with valid userId and client", () => {
    const userId = "testUserId";
    const user = new User(userId, mockApiClients);

    expect(user.getUserId()).toBe(userId);
    expect(user.toString()).toBe(`Coinbase:User{userId: ${userId}}`);
  });

  it("should throw an InternalError if userId is empty", () => {
    expect(() => new User("", mockApiClients)).toThrow(InternalError);
    expect(() => new User("", mockApiClients)).toThrow("UserID cannot be empty");
  });

  it("should throw an InternalError if client is empty", () => {
    expect(() => new User("testUserId", null as unknown as ApiClients)).toThrow(InternalError);
    expect(() => new User("testUserId", null as unknown as ApiClients)).toThrow(
      "Client cannot be empty",
    );
  });
});

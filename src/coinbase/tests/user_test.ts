import { User } from "./../user";
import { ApiClients } from "./../types";
import { User as UserModel } from "./../../client/api";

describe("User Class", () => {
  let mockUserModel: UserModel;
  let mockApiClients: ApiClients;

  beforeEach(() => {
    mockUserModel = {
      id: "12345",
    } as UserModel;

    mockApiClients = {} as ApiClients;
  });

  it("should correctly initialize with given user model and api clients with a valid user id", () => {
    const user = new User(mockUserModel, mockApiClients);
    expect(user).toBeInstanceOf(User);
    expect(user.getUserId()).toBe(mockUserModel.id);
  });

  it("should return the correct string representation", () => {
    const user = new User(mockUserModel, mockApiClients);
    expect(user.toString()).toBe(`Coinbase:User{userId: ${mockUserModel.id}}`);
  });
});

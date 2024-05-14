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

  it("should initialize User instance with a valid user model and API clients, and set the user ID correctly", () => {
    const user = new User(mockUserModel, mockApiClients);
    expect(user).toBeInstanceOf(User);
    expect(user.getUserId()).toBe(mockUserModel.id);
  });

  it("should return a correctly formatted string representation of the User instance", () => {
    const user = new User(mockUserModel, mockApiClients);
    expect(user.toString()).toBe(`Coinbase:User{userId: ${mockUserModel.id}}`);
  });
});

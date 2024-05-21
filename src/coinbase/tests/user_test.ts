import { User as UserModel } from "./../../client/api";
import { User } from "./../user";

describe("User Class", () => {
  let mockUserModel: UserModel;
  beforeEach(() => {
    mockUserModel = {
      id: "12345",
    } as UserModel;
  });

  it("should initialize User instance with a valid user model and API clients, and set the user ID correctly", () => {
    const user = new User(mockUserModel);
    expect(user).toBeInstanceOf(User);
    expect(user.getId()).toBe(mockUserModel.id);
  });

  it("should return a correctly formatted string representation of the User instance", () => {
    const user = new User(mockUserModel);
    expect(user.toString()).toBe(`User{ userId: ${mockUserModel.id} }`);
  });
});

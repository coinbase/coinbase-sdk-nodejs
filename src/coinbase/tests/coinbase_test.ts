import { Coinbase } from "../coinbase";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const axiosMock = new MockAdapter(axios);

describe("Coinbase tests", () => {
  const PATH_PREFIX = "./src/coinbase/tests/config";
  it("should throw an error if the API key name or private key is empty", () => {
    expect(() => new Coinbase("", "")).toThrow("Invalid configuration");
  });

  it("should throw an error if the file does not exist", () => {
    expect(() => Coinbase.fromJsonConfig(`${PATH_PREFIX}/does-not-exist.json`)).toThrow(
      "Invalid configuration",
    );
  });

  it("should initialize the Coinbase SDK from a JSON file", () => {
    const cbInstance = Coinbase.fromJsonConfig(`${PATH_PREFIX}/coinbase_cloud_api_key.json`);
    expect(cbInstance).toBeInstanceOf(Coinbase);
  });

  it("should throw an error if there is an issue reading the file or parsing the JSON data", () => {
    expect(() => Coinbase.fromJsonConfig(`${PATH_PREFIX}/invalid.json`)).toThrow(
      "Not able to parse the configuration file",
    );
  });

  it("should throw an error if the JSON file is not parseable", () => {
    expect(() => Coinbase.fromJsonConfig(`${PATH_PREFIX}/not_parseable.json`)).toThrow(
      "Not able to parse the configuration file",
    );
  });

  it("should able to get the default user", async () => {
    axiosMock.onGet().reply(200, {
      id: 123,
    });
    const cbInstance = Coinbase.fromJsonConfig(`${PATH_PREFIX}/coinbase_cloud_api_key.json`, true);
    const user = await cbInstance.defaultUser();
    expect(user.getUserId()).toBe(123);
    expect(user.toString()).toBe("Coinbase:User{userId: 123}");
  });

  it("should raise an error if the user is not found", async () => {
    axiosMock.onGet().reply(404, {
      id: 123,
    });
    const cbInstance = Coinbase.fromJsonConfig(`${PATH_PREFIX}/coinbase_cloud_api_key.json`);
    expect(cbInstance.defaultUser()).rejects.toThrow("Request failed with status code 404");
  });
});

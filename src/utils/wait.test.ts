import { wait } from "./wait";
import { TimeoutError } from "../coinbase/errors";

describe("wait", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should resolve immediately if initial state is terminal", async () => {
    const mockReload = jest.fn().mockResolvedValue("COMPLETED");
    const isTerminal = (status: string) => status === "COMPLETED";

    const promise = wait(mockReload, isTerminal);
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("COMPLETED");
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("should poll until terminal state is reached", async () => {
    const mockReload = jest
      .fn()
      .mockResolvedValueOnce("PENDING")
      .mockResolvedValueOnce("PROCESSING")
      .mockResolvedValue("COMPLETED");
    const isTerminal = (status: string) => status === "COMPLETED";

    const promise = wait(mockReload, isTerminal, undefined, {
      intervalSeconds: 0.01,
    });
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe("COMPLETED");
    expect(mockReload).toHaveBeenCalledTimes(3);
  });

  it("should transform the result using provided transform function", async () => {
    const mockReload = jest.fn().mockResolvedValue("COMPLETED");
    const isTerminal = (status: string) => status === "COMPLETED";
    const transform = (status: string) => ({ status });

    const promise = wait(mockReload, isTerminal, transform);
    await jest.runAllTimersAsync();

    const result = await promise;
    expect(result).toEqual({ status: "COMPLETED" });
  });

  it("should respect custom interval", async () => {
    const mockReload = jest.fn().mockResolvedValueOnce("PENDING").mockResolvedValue("COMPLETED");

    const isTerminal = (status: string) => status === "COMPLETED";

    wait(mockReload, isTerminal, undefined, { intervalSeconds: 0.5 });

    await jest.advanceTimersByTimeAsync(0);
    expect(mockReload).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(499);
    expect(mockReload).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(mockReload).toHaveBeenCalledTimes(2);
  });

  it("should throw TimeoutError after specified timeout", async () => {
    const mockReload = jest.fn().mockResolvedValue("PENDING");
    const isTerminal = (status: string) => status === "COMPLETED";

    const promise = wait(mockReload, isTerminal, undefined, {
      timeoutSeconds: 1,
      intervalSeconds: 0.2,
    });
    promise.catch(error => {
      expect(error).toBeInstanceOf(TimeoutError);
    });

    await jest.runAllTimersAsync();

    expect(mockReload.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(mockReload.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it("should handle reload function failures", async () => {
    const mockReload = jest.fn().mockRejectedValue(new Error("Network error"));
    const isTerminal = (status: string) => status === "COMPLETED";

    const promise = wait(mockReload, isTerminal);
    await expect(promise).rejects.toThrow("Network error");
  });
});

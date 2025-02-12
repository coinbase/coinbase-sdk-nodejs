import { TimeoutError } from "../errors";

export type WaitOptions = {
  intervalSeconds?: number;
  timeoutSeconds?: number;
};

export async function wait<T>(
  reload: () => Promise<T>,
  isTerminal: (obj: T) => boolean,
  options: WaitOptions = {},
): Promise<T> {
  const { intervalSeconds = 0.2, timeoutSeconds = 10 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const updatedObject = await reload();

    if (isTerminal(updatedObject)) {
      return updatedObject;
    }

    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
  }

  throw new TimeoutError(`Operation timed out after ${timeoutSeconds} seconds`);
}

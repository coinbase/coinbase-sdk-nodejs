import { TimeoutError } from "../coinbase/errors";

export type WaitOptions = {
  intervalSeconds?: number;
  timeoutSeconds?: number;
};

export async function wait<T, K = T>(
  reload: () => Promise<T>,
  isTerminal: (obj: T) => boolean,
  transform: (obj: T) => K = (obj: T) => obj as unknown as K,
  options: WaitOptions = {},
): Promise<K> {
  const { intervalSeconds = 0.2, timeoutSeconds = 10 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const updatedObject = await reload();

    if (isTerminal(updatedObject)) {
      return transform(updatedObject);
    }

    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
  }

  throw new TimeoutError(`Operation timed out after ${timeoutSeconds} seconds`);
}
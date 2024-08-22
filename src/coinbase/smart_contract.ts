import { Coinbase } from "./coinbase";
import { ContractEvent } from "./contract_event";

/**
 * A representation of a SmartContract on the blockchain.
 */
export class SmartContract {
  /**
   * Returns a list of ContractEvents for the provided network, contract, and event details.
   *
   * @param networkId - The network ID.
   * @param protocolName - The protocol name.
   * @param contractAddress - The contract address.
   * @param contractName - The contract name.
   * @param eventName - The event name.
   * @param fromBlockHeight - The start block height.
   * @param toBlockHeight - The end block height.
   * @returns The contract events.
   */
  public static async listEvents(
    networkId: string,
    protocolName: string,
    contractAddress: string,
    contractName: string,
    eventName: string,
    fromBlockHeight: number,
    toBlockHeight: number,
  ): Promise<ContractEvent[]> {
    const contractEvents: ContractEvent[] = [];
    const queue: string[] = [""];

    while (queue.length > 0) {
      const page = queue.shift();

      const response = await Coinbase.apiClients.smartContract!.listContractEvents(
        networkId,
        protocolName,
        contractAddress,
        contractName,
        eventName,
        fromBlockHeight,
        toBlockHeight,
        page?.length ? page : undefined,
      );

      response.data.data.forEach(contractEvent => {
        contractEvents.push(new ContractEvent(contractEvent));
      });

      if (response.data.has_more) {
        if (response.data.next_page) {
          queue.push(response.data.next_page);
        }
      }
    }

    return contractEvents;
  }
}

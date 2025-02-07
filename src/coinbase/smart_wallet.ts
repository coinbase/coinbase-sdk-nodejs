import { NetworkIdentifier, SmartWallet as SmartWalletModel } from "../client";

import { Coinbase } from "./coinbase";

import type { Hex } from 'viem';
import type {
  UserOperationCalls
} from 'viem/account-abstraction';

import { encodeAbiParameters, encodeFunctionData, encodePacked, LocalAccount, parseSignature, size } from "viem";
import { UserOperation } from "./user_operation";

export class SmartWallet {
  private model: SmartWalletModel;
  private account: LocalAccount;
  private networkId?: NetworkIdentifier;

  public constructor(model: SmartWalletModel, account: LocalAccount) {
    this.model = model;
    this.account = account;
  }

  public static async create({account}: {account: LocalAccount}): Promise<SmartWallet> {
    const result = await Coinbase.apiClients.smartWallet!.createSmartWallet({
        owner: account.address,
    });

    const smartWallet = new SmartWallet(result.data!, account);
    return smartWallet;
  }

  public static async connect({smartWalletAddress, account}: {smartWalletAddress: string, account: LocalAccount}): Promise<SmartWallet> {
    const result = await Coinbase.apiClients.smartWallet!.getSmartWallet(smartWalletAddress);

    if (!result.data?.owners.some(owner => owner.toLowerCase() === account.address.toLowerCase())) {
      throw new Error('Account is not an owner of the smart wallet');
    }

    const smartWallet = new SmartWallet(result.data!, account);
    return smartWallet;
  }

  public async use({networkId}: {networkId: NetworkIdentifier}) {
    this.networkId = networkId;
  }
 
  public getAddress() {
    return this.model.address;
  }

  private wrapSignature(parameters: {
    ownerIndex?: number | undefined
    signature: Hex
  }) {

    const { ownerIndex = 0 } = parameters
    const signatureData = (() => {
      if (size(parameters.signature) !== 65) return parameters.signature
      const signature = parseSignature(parameters.signature)
      return encodePacked(
        ['bytes32', 'bytes32', 'uint8'],
        [signature.r, signature.s, signature.yParity === 0 ? 27 : 28],
      )
    })()
    return encodeAbiParameters(
      [
        {
          components: [
            {
              name: 'ownerIndex',
              type: 'uint8',
            },
            {
              name: 'signatureData',
              type: 'bytes',
            },
          ],
          type: 'tuple',
        },
      ],
      [
        {
          ownerIndex,
          signatureData,
        },
      ],
    )
  }

  public async sendUserOperation<T extends readonly unknown[]>(
    params: { calls: UserOperationCalls<T> }
  ): Promise<UserOperation> {
    if (!this.networkId) {
      throw new Error('Network not set - call use({networkId}) first');
    }

    const encodedCalls = params.calls.map((call) => {
      if ('abi' in call) {
        return {
          data: encodeFunctionData({
            abi: call.abi,
            functionName: call.functionName,
            args: call.args
          }),
          to: call.to,
          value: call.value.toString() || '0'
        }
      }
      return {
        data: call.data,
        to: call.to,
        value: call.value.toString() || '0'
      }
    })

    const createOpResponse = await Coinbase.apiClients.smartWallet!.createUserOperation(
      this.getAddress(),
      this.networkId,
      {
        calls: encodedCalls
      }
    )

    if (!createOpResponse.data) {
      throw new Error('Failed to create user operation')
    }

    if (!this.account.sign) {
      throw new Error('Account does not support signing')
    }

    const signature = await this.account.sign({ hash: createOpResponse.data.unsigned_payload as `0x${string}` })
    const wrappedSignature = this.wrapSignature({ ownerIndex: 0, signature })

    const broadcastResponse = await Coinbase.apiClients.smartWallet!.broadcastUserOperation(
      this.getAddress(),
      createOpResponse.data.id,
      {
        signature: wrappedSignature
      }
    )

    if (!broadcastResponse.data) {
      throw new Error('Failed to broadcast user operation')
    }

    return new UserOperation(broadcastResponse.data, this.getAddress());
  }

}

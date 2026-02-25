import { networkConfig } from '../config/networkConfig'

export class SubgraphService {
  private static instance: SubgraphService

  public static getInstance(): SubgraphService {
    if (!SubgraphService.instance) {
      SubgraphService.instance = new SubgraphService()
    }
    return SubgraphService.instance
  }

  async getSwapTxByNullifiers(
    chainId: number,
    aliceNullifier: string,
    bobNullifier: string
  ): Promise<{
    txHash: string
    aliceInNote: string
    aliceChangeNote: string
  } | null> {
    const query = `
            query findSwapByNullifiers{
                darkSwapProSwaps(where: {aliceOutNullifier: "${aliceNullifier}", bobOutNullifier: "${bobNullifier}"}) {
                    aliceOutNullifier
                    bobOutNullifier
                    bobInNote
                    aliceInNote
                    aliceChangeNote
                    transactionHash
                }
            }
        `

    const response = await fetch(networkConfig[chainId].drakSwapSubgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    const data = await response.json()

    if (
      !data ||
      !data.data ||
      !data.data.darkSwapProSwaps ||
      data.data.darkSwapProSwaps.length === 0
    ) {
      return null
    }

    return {
      txHash: data.data.darkSwapProSwaps[0].transactionHash,
      aliceInNote: data.data.darkSwapProSwaps[0].aliceInNote,
      aliceChangeNote: data.data.darkSwapProSwaps[0].aliceChangeNote
    }
  }
}

import { networkConfig } from '../config/networkConfig'

export class SubgraphService {
  private static instance: SubgraphService

  public static getInstance(): SubgraphService {
    if (!SubgraphService.instance) {
      SubgraphService.instance = new SubgraphService()
    }
    return SubgraphService.instance
  }

  async getCreateOrderTxByNote(
    chainId: number,
    outNote: string
  ): Promise<string | null> {
    const query = `
            query findCreateOrderByNote{
                darkSwapRetailDepositCreateOrders(where: {depositOutNote: "${outNote}"}) {
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
      !data.data.darkSwapRetailDepositCreateOrders ||
      data.data.darkSwapRetailDepositCreateOrders.length === 0
    ) {
      return null
    }

    return data.data.darkSwapRetailDepositCreateOrders[0].transactionHash
  }

  async getWithdrawTxByNote(
    chainId: number,
    nullifier: string
  ): Promise<string | null> {
    const query = `
            query findWithdrawByNote{
                darkSwapWithdraws(where: {nullifierIn: "${nullifier}"}) {
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
      !data.data.darkSwapWithdraws ||
      data.data.darkSwapWithdraws.length === 0
    ) {
      return null
    }

    return data.data.darkSwapWithdraws[0].transactionHash
  }
}

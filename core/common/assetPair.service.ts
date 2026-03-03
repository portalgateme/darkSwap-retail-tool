import { DarkSwapConfig } from '../types'
import { AgentService } from './agent.service'
import { DatabaseService } from './db/database.service'

export class AssetPairService {
  private dbService: DatabaseService
  private agentService: AgentService

  public constructor(dbService: DatabaseService, agentService: AgentService) {
    this.dbService = dbService
    this.agentService = agentService
  }

  async syncAssetPairs(chainIds: number[]) {
    console.log('Syncing asset pairs for chains:', chainIds)

    for (const chainId of chainIds) {
      console.log(`Syncing asset pairs for chainId: ${chainId}`)

      try {
        const assetPairs = await this.agentService.getAssetPairs(chainId)
        for (const assetPair of assetPairs) {
          const assetPairDb = await this.dbService.getAssetPairById(
            assetPair.id,
            assetPair.chainId
          )
          if (!assetPairDb) {
            await this.dbService.addAssetPair(assetPair)
          }
        }
      } catch (error) {
        console.error(
          `Error syncing asset pairs for chainId ${chainId}:`,
          error
        )
      }
    }

    console.log('Asset pair sync completed')
  }
}

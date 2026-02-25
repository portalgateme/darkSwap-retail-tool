import { AssetPairDto, DarkSwapConfig } from '../types'
import { DatabaseService } from './db/database.service'
import axios from 'axios'

export class AssetPairService {
  private dbService: DatabaseService
  private config: DarkSwapConfig

  public constructor(config: DarkSwapConfig, dbService: DatabaseService) {
    this.dbService = dbService
    this.config = config
  }

  async syncAssetPairs(chainIds: number[]) {
    console.log('Syncing asset pairs for chains:', chainIds)

    for (const chainId of chainIds) {
      console.log(`Syncing asset pairs for chainId: ${chainId}`)

      try {
        const result = await axios.get(
          `${this.config.bookNodeApiUrl}/api/tradingPairs/${chainId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (
          result.status == 200 &&
          result.data.code == 200 &&
          result.data.data
        ) {
          const assetPairs = result.data.data as AssetPairDto[]
          console.log(
            `Found ${assetPairs.length} asset pairs for chainId: ${chainId}`
          )

          for (const assetPair of assetPairs) {
            const assetPairDb = await this.dbService.getAssetPairById(
              assetPair.id,
              assetPair.chainId
            )
            if (!assetPairDb) {
              await this.dbService.addAssetPair(assetPair)
            }
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

  async syncAssetPair(assetPairId: string, chainId: number) {
    const result = await axios.get(
      `${this.config.bookNodeApiUrl}/assetPair/getAssetPair/${assetPairId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const assetPair = result.data as AssetPairDto
    const assetPairDb = await this.dbService.getAssetPairById(
      assetPair.id,
      chainId
    )
    if (!assetPairDb) {
      await this.dbService.addAssetPair(assetPair)
    }
  }
}

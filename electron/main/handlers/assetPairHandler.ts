import { ipcMain } from 'electron'
import { db, config } from '../database'
import { getCurrentInstance } from '../utils/coreReloader'

export const registerAssetPairHandlers = () => {
  ipcMain.handle('assetPair:syncAssetPairs', async (event) => {
    const dbInstance = getCurrentInstance()
    if (!config) throw new Error('Config not loaded')
    await dbInstance
      .getAssetPairService()
      .syncAssetPairs(config.chainRpcs.map((rpc) => rpc.chainId))
    return true
  })

  ipcMain.handle(
    'assetPair:syncAssetPair',
    async (event, assetPairId, chainId) => {
      const dbInstance = getCurrentInstance()
      await dbInstance.getAssetPairService().syncAssetPairs([chainId])
      return true
    }
  )

  ipcMain.handle('assetPair:getAssetPairs', async (event, chainId) => {
    const assetPairs = db
      .prepare('SELECT * FROM ASSET_PAIRS WHERE chainId = ?')
      .all(chainId)
    return assetPairs
  })
}

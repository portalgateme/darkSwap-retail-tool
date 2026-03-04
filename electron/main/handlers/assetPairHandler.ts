import { ipcMain } from 'electron'
import { db, config, dbPath } from '../database'
import { getCurrentInstance, reloadCore } from '../utils/coreReloader'

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
    let assetPairs = db
      .prepare('SELECT * FROM ASSET_PAIRS WHERE chainId = ?')
      .all(chainId)

    if (assetPairs.length === 0) {
      let dbInstance
      try {
        dbInstance = getCurrentInstance()
      } catch {
        await reloadCore(db, dbPath)
        dbInstance = getCurrentInstance()
      }

      await dbInstance.getAssetPairService().syncAssetPairs([chainId])
      assetPairs = db
        .prepare('SELECT * FROM ASSET_PAIRS WHERE chainId = ?')
        .all(chainId)
    }

    return assetPairs
  })
}

import { ipcMain } from 'electron'
import dbInstance, { config, db } from '../database'

export const registerAssetPairHandlers = () => {
  ipcMain.handle('assetPair:syncAssetPairs', async (event) => {
    if (!config) throw new Error('Config not loaded')
    await dbInstance
      .getAssetPairService()
      .syncAssetPairs(config.chainRpcs.map((rpc) => rpc.chainId))

    return true
  })

  ipcMain.handle(
    'assetPair:syncAssetPair',
    async (event, assetPairId, chainId) => {
      await dbInstance.getAssetPairService().syncAssetPair(assetPairId, chainId)
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

import { ipcMain } from 'electron'
import { config } from '../database'
import { getCurrentInstance } from '../utils/coreReloader'

export const registerRPCManagerHandlers = () => {
  // get Provider
  ipcMain.handle('rpcManager:getProvider', async (event, chainId: number) => {
    const dbInstance = getCurrentInstance()
    const rpcManager = dbInstance.getRpcManager().getProvider(chainId)
    return rpcManager
  })

  // getSignerAndPublicKey
  ipcMain.handle(
    'rpcManager:getSignerAndPublicKey',
    async (event, walletAddress: string, chainId: number) => {
      const dbInstance = getCurrentInstance()
      const rpcManager = dbInstance
        .getRpcManager()
        .getSignerAndPublicKey(walletAddress, chainId)
      return rpcManager
    }
  )

  // reloadProviders
  ipcMain.handle('rpcManager:reloadProviders', () => {
    const dbInstance = getCurrentInstance()
    dbInstance.getRpcManager().reloadProviders()
    return true
  })

  ipcMain.handle('rpcManager:getAllProviders', () => {
    const providers = config ? config.chainRpcs : []
    return providers
  })
}

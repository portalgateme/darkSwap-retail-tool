import { ipcMain } from 'electron'
import dbInstance, { config } from '../database'

export const registerRPCManagerHandlers = () => {
  // get Provider
  ipcMain.handle('rpcManager:getProvider', async (event, chainId: number) => {
    const rpcManager = dbInstance.getRpcManager().getProvider(chainId)
    return rpcManager
  })

  // getSignerForUserSwapRelayer
  ipcMain.handle(
    'rpcManager:getSignerForUserSwapRelayer',
    async (event, chainId: number) => {
      const rpcManager = dbInstance
        .getRpcManager()
        .getSignerForUserSwapRelayer(chainId)
      return rpcManager
    }
  )

  // getSignerAndPublicKey
  ipcMain.handle(
    'rpcManager:getSignerAndPublicKey',
    async (event, walletAddress: string, chainId: number) => {
      const rpcManager = dbInstance
        .getRpcManager()
        .getSignerAndPublicKey(walletAddress, chainId)
      return rpcManager
    }
  )

  // reloadProviders
  ipcMain.handle('rpcManager:reloadProviders', () => {
    dbInstance.getRpcManager().reloadProviders()
    return true
  })

  ipcMain.handle('rpcManager:getAllProviders', () => {
    const providers = config ? config.chainRpcs : []
    return providers
  })
}

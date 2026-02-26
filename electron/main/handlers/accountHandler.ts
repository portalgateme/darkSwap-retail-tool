import { ipcMain } from 'electron'
import { config, db } from '../database'
import { getCurrentInstance, reloadCore } from '../utils/coreReloader'
import * as path from 'path'
import { app } from 'electron'

export function registerAccountHandlers() {
  ipcMain.handle('account:getWallets', async (event) => {
    console.log('Handling account:getWallets')
    const result = await db.prepare('SELECT * FROM wallets').all()
    return result
  })

  ipcMain.handle(
    'account:getAssetsByChainIdAndWallet',
    async (event, chainId, wallet) => {
      const dbInstance = getCurrentInstance()
      const result = await dbInstance
        .getAssetManager()
        .getAssetsByChainIdAndWallet({ chainId, wallet })
      return result
    }
  )

  ipcMain.handle('account:syncAssets', async (event, chainId, wallet) => {
    const dbInstance = getCurrentInstance()
    await dbInstance.getAssetManager().syncAssets({ chainId, wallet })
    return true
  })

  ipcMain.handle(
    'account:syncOneAsset',
    async (event, chainId, wallet, asset) => {
      const dbInstance = getCurrentInstance()

      await dbInstance
        .getAssetManager()
        .syncOneAsset({ chainId, wallet, asset })
      return true
    }
  )

  // Deposit
  ipcMain.handle(
    'account:deposit',
    async (event, chainId, wallet, asset, amount) => {
      console.log('Depositing:', { chainId, wallet, asset, amount })
      const dbInstance = getCurrentInstance()
      await dbInstance
        .getAssetManager()
        .deposit({ chainId, wallet, asset, amount: amount.toString() })
      return true
    }
  )

  // Withdraw
  ipcMain.handle(
    'account:withdraw',
    async (event, chainId, wallet, asset, amount) => {
      const dbInstance = getCurrentInstance()

      await dbInstance
        .getAssetManager()
        .withdraw({ chainId, wallet, asset, amount: amount.toString() })
      return true
    }
  )

  // Add new wallet
  ipcMain.handle(
    'account:addWallet',
    async (event, name, address, privateKey, type) => {
      console.log('Adding wallet:', name, address, type, privateKey)

      // Check if wallet already exists
      const existingWallet = db
        .prepare('SELECT id FROM wallets WHERE address = ?')
        .get(address)
      if (existingWallet) {
        //@ts-ignore
        return { id: existingWallet.id, exists: true }
      }

      const stmt = db.prepare(
        'INSERT INTO wallets (name, address, privateKey, type) VALUES (?, ?, ?, ?)'
      )
      const result = stmt.run(name, address, privateKey, type)

      // Reload core instance with new wallet
      const userDataPath = app.getPath('userData')
      if (!config) {
        throw new Error('Account Handler: Failed to load configuration')
      }
      const dbPath = path.join(userDataPath, config.dbFilePath)
      await reloadCore(db, dbPath)
      console.log('DarkSwapClientCore reloaded after adding wallet')

      return { id: result.lastInsertRowid, exists: false }
    }
  )

  // Remove wallet
  ipcMain.handle('account:removeWallet', async (event, walletId) => {
    const stmt = db.prepare('DELETE FROM wallets WHERE id = ?')
    stmt.run(walletId)

    // Reload core instance after removing wallet
    const userDataPath = app.getPath('userData')
    if (!config) {
      throw new Error('Account Handler: Failed to load configuration')
    }
    const dbPath = path.join(userDataPath, config.dbFilePath)
    await reloadCore(db, dbPath)
    console.log('DarkSwapClientCore reloaded after removing wallet')

    return true
  })

  // Check private key already exists
  ipcMain.handle('account:checkPrivateKeyExists', (event, privateKey) => {
    const existingWallet = db
      .prepare('SELECT id FROM wallets WHERE privateKey = ?')
      .get(privateKey)
    return !!existingWallet
  })
}

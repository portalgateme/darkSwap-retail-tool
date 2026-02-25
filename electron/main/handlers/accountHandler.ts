import { ipcMain } from 'electron'
import dbInstance, { db } from '../database'

export function registerAccountHandlers() {
  ipcMain.handle('account:getWallets', async (event) => {
    console.log('Handling account:getWallets')
    const result = await db.prepare('SELECT * FROM wallets').all()
    return result
  })

  ipcMain.handle(
    'account:getAssetsByChainIdAndWallet',
    async (event, chainId, wallet) => {
      const result = await dbInstance
        .getAssetManager()
        .getAssetsByChainIdAndWallet({ chainId, wallet })
      return result
    }
  )

  ipcMain.handle('account:syncAssets', async (event, chainId, wallet) => {
    await dbInstance.getAssetManager().syncAssets({ chainId, wallet })
    return true
  })

  ipcMain.handle(
    'account:syncOneAsset',
    async (event, chainId, wallet, asset) => {
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
      await dbInstance
        .getAssetManager()
        .withdraw({ chainId, wallet, asset, amount: amount.toString() })
      return true
    }
  )

  // Add new wallet
  ipcMain.handle(
    'account:addWallet',
    (event, name, address, privateKey, type) => {
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
      return { id: result.lastInsertRowid, exists: false }
    }
  )

  // Remove wallet
  ipcMain.handle('account:removeWallet', (event, walletId) => {
    const stmt = db.prepare('DELETE FROM wallets WHERE id = ?')
    stmt.run(walletId)
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

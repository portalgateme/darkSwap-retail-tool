import { ipcMain } from 'electron'
import { config, db, dbPath } from '../database'
import { DarkSwapClientCore, DarkSwapConfig } from '../../../core'
import axios from 'axios'

export function registerConfigHandlers() {
  ipcMain.handle('config:getConfigs', async (event) => {
    const result = await db.prepare('SELECT * FROM configs').all()
    return result
  })

  ipcMain.handle('config:setConfig', async (event, key, value) => {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)'
    )
    stmt.run(key, value)
    return { success: true }
  })

  // update to handle multiple configs
  ipcMain.handle(
    'config:setConfigs',
    async (event, configs: { [key: string]: string }) => {
      const insert = db.prepare(
        'INSERT INTO configs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
      )
      const insertMany = db.transaction(
        (configs: { [key: string]: string }) => {
          for (const key in configs) {
            insert.run(key, configs[key])
          }
        }
      )
      insertMany(configs)
      event.sender.send('app:restart')
      return { success: true }
    }
  )

  // Heathcheck config handler
  ipcMain.handle('config:healthCheck', async (event) => {
    try {
      if (!config) {
        throw new Error('Failed to load configuration')
      }

      const listAsset = await axios.get(
        `${config.bookNodeApiUrl}/api/tradingPairs/31337`
      )
      if (listAsset.status !== 200) {
        throw new Error('API endpoint is not healthy')
      }

      return { healthy: true }
    } catch (error: any) {
      return { healthy: false }
    }
  })
}

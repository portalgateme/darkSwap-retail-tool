import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'
import { ConfigLoader } from '../utils/configUtil'
import { app } from 'electron'
import { DarkSwapClientCore, DarkSwapConfig } from '../../core'

export const config = ConfigLoader.getInstance().getConfig()

if (!config) {
  throw new Error('Failed to load configuration')
}

const userDataPath = app.getPath('userData')
if (!fs.existsSync(userDataPath))
  fs.mkdirSync(userDataPath, { recursive: true })

export const dbPath = path.join(userDataPath, config.dbFilePath)
console.log('SQLite path:', dbPath)
export const db = new Database(dbPath, { verbose: console.log })

// INITIALIZE DATABASE SCHEMA
// Initialize wallets table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    privateKey TEXT,
    type TEXT
  )
`
).run()
// Initialize configs table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT,
    value TEXT,
    UNIQUE(key)
  )
`
).run()

const wallets = db.prepare('SELECT * FROM wallets').all() as Array<{
  id: number
  name: string
  address: string
  privateKey: string
  type: 'privateKey' | 'fireblocks'
}>

const configs = db.prepare('SELECT * FROM configs').all() as Array<{
  id: number
  key: string
  value: string
}>

console.log('Loaded wallets from DB:', wallets)
console.log('Loaded configs from DB:', configs)

const darkSwapConfig: DarkSwapConfig = {
  wallets: [...config.wallets, ...wallets],
  chainRpcs: config.chainRpcs || [],
  dbFilePath: dbPath,
  bookNodeApiUrl: config.bookNodeApiUrl || 'https://api.darknode.io/api'
}
const instance = new DarkSwapClientCore(darkSwapConfig, db)

// Sync asset pairs with BookNode
instance
  .getAssetPairService()
  .syncAssetPairs(config.chainRpcs.map((rpc) => rpc.chainId))
  .catch((err) => {
    console.error('Failed to sync asset pairs:', err)
  })
// Start auto order scheduler
instance.getAutoOrderManager().start()
instance.getRetailOrderManager().startStatusCheck()

export default instance

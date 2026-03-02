import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'
import { ConfigLoader } from '../utils/configUtil'
import { app } from 'electron'
import {
  getOrCreateCoreInstance,
  initializeCoreReloader
} from './utils/coreReloader'

export const config = ConfigLoader.getInstance().getConfig()

if (!config) {
  throw new Error('Failed to load configuration')
}

const userDataPath = app.getPath('userData')
if (!fs.existsSync(userDataPath))
  fs.mkdirSync(userDataPath, { recursive: true })

export const dbPath = path.join(userDataPath, config.dbFilePath)
console.log('SQLite path:', dbPath)
export const db = new Database(dbPath)

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

initializeCoreReloader({ db, dbPath })
getOrCreateCoreInstance(db, dbPath, config, wallets)

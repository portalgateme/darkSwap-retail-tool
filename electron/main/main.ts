import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import serve from 'electron-serve'
import { registerAccountHandlers } from './handlers/accountHandler'
import { registerAssetPairHandlers } from './handlers/assetPairHandler'
import { registerOrderHandlers } from './handlers/orderHandler'
import { registerRPCManagerHandlers } from './handlers/rpcManagerHandler'
import { registerConfigHandlers } from './handlers/configHandler'
import { registerAppHandlers } from './handlers/appHandler'
import { registerAutoOrderHandlers } from './handlers/autoOrderHandler'

const appServe = app.isPackaged
  ? serve({ directory: path.join(__dirname, '../renderer/out') })
  : null

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js')
    },
    autoHideMenuBar: true
  })

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    if (!mainWindow || !appServe) return
    appServe(mainWindow).then(() => {
      if (!mainWindow) return
      mainWindow.loadURL('app://-')
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register IPC handlers
registerAppHandlers()
registerConfigHandlers()
registerAccountHandlers()
registerAssetPairHandlers()
registerOrderHandlers()
registerAutoOrderHandlers()
registerRPCManagerHandlers()

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

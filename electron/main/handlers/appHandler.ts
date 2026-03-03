import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater, ProgressInfo, UpdateInfo } from 'electron-updater'
import { ConfigLoader } from '../../utils/configUtil'

type UpdateStatusPayload =
  | { status: 'checking' }
  | { status: 'available'; info: { version: string; releaseName?: string } }
  | { status: 'not-available' }
  | {
      status: 'downloading'
      progress: { percent: number; bytesPerSecond: number }
    }
  | { status: 'downloaded'; info: { version: string; releaseName?: string } }
  | { status: 'error'; error: string }


const broadcastUpdateStatus = (payload: UpdateStatusPayload) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('app:update:status', payload)
  })
}

export const registerAppHandlers = () => {
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:checkForUpdates', async () => {
    if (!app.isPackaged) {
      broadcastUpdateStatus({ status: 'not-available' })
      return { status: 'not-available' as const, reason: 'dev-mode' }
    }

    try {
      const result = await autoUpdater.checkForUpdates()
      return result?.updateInfo
        ? { status: 'available' as const, info: result.updateInfo }
        : { status: 'not-available' as const }
    } catch (error) {
      broadcastUpdateStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Update error'
      })
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Update error'
      }
    }
  })

  ipcMain.handle('app:downloadUpdate', async () => {
    if (!app.isPackaged) {
      return { status: 'not-available' as const, reason: 'dev-mode' }
    }

    try {
      await autoUpdater.downloadUpdate()
      return { status: 'downloading' as const }
    } catch (error) {
      broadcastUpdateStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Update error'
      })
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Update error'
      }
    }
  })

  ipcMain.handle('app:installUpdate', async () => {
    if (!app.isPackaged) {
      return { status: 'not-available' as const, reason: 'dev-mode' }
    }

    autoUpdater.quitAndInstall()
    return { status: 'installing' as const }
  })

  app.on('ready', () => {
  })
}

import { app, BrowserWindow, ipcMain } from 'electron'

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

  app.on('ready', () => {
  })
}

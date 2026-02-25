import { ipcMain } from 'electron'
import dbInstance from '../database'

export const registerAutoOrderHandlers = () => {
  ipcMain.handle('autoOrder:createJob', async (event, jobDto) => {
    return await dbInstance.getAutoOrderManager().createJob(jobDto)
  })

  ipcMain.handle('autoOrder:pauseJob', async (event, jobId: string) => {
    await dbInstance.getAutoOrderManager().pauseJob(jobId)
    return true
  })

  ipcMain.handle('autoOrder:resumeJob', async (event, jobId: string) => {
    await dbInstance.getAutoOrderManager().resumeJob(jobId)
    return true
  })

  ipcMain.handle('autoOrder:cancelJob', async (event, jobId: string) => {
    await dbInstance.getAutoOrderManager().cancelJob(jobId)
    return true
  })

  ipcMain.handle(
    'autoOrder:updateMarketPrice',
    async (
      event,
      chainId: number,
      assetPairId: string,
      marketPrice: string
    ) => {
      await dbInstance
        .getAutoOrderManager()
        .updateMarketPrice(chainId, assetPairId, marketPrice)
      return true
    }
  )

  ipcMain.handle('autoOrder:getJob', async (event, jobId: string) => {
    return await dbInstance.getAutoOrderManager().getJob(jobId)
  })

  ipcMain.handle('autoOrder:updateJob', async (event, jobDto) => {
    return await dbInstance.getAutoOrderManager().updateJob(jobDto)
  })

  ipcMain.handle(
    'autoOrder:getJobsByPage',
    async (event, chainId, page, limit, sort, status, search) => {
      return await dbInstance
        .getAutoOrderManager()
        .getJobsByPage(chainId, page, limit, sort, status, search)
    }
  )
}

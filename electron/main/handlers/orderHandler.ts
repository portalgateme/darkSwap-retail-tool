import { ipcMain } from 'electron'
import { getCurrentInstance } from '../utils/coreReloader'

export const registerOrderHandlers = () => {

  // cancelOrder
  ipcMain.handle('order:cancelOrder', async (event, cancelOrderDto) => {
    const dbInstance = getCurrentInstance()
    await dbInstance.getRetailOrderManager().cancelOrder(cancelOrderDto)
    return true
  })

  // getAllOrders
  ipcMain.handle(
    'order:getAllOrders',
    async (event, chainId, page, limit, sort, status, search) => {
      const dbInstance = getCurrentInstance()
      const result = await dbInstance
        .getOrderManager()
        .getOrdersByPage(chainId, page, limit, sort, status, search)

      return {
        total: result.total,
        orders: await Promise.all(
          result.orders.map(async (order) => {
            if (!order.id) return null
            const result = await dbInstance
              .getOrderManager()
              .getOrderEvents(order.orderId.toString())

            return {
              ...order,
              events: result
            }
          })
        )
      }
    }
  )

  // getOrderById
  ipcMain.handle('order:getOrderById', async (event, orderId) => {
    const dbInstance = getCurrentInstance()
    return await dbInstance.getOrderManager().getOrderById(orderId)
  })

  // getAssetPairs
  ipcMain.handle('order:getAssetPairs', async (event, chainId) => {
    const dbInstance = getCurrentInstance()
    return await dbInstance.getOrderManager().getAssetPairs(chainId)
  })

  // getOrderEvents
  ipcMain.handle('order:getOrderEvents', async (event, orderId) => {
    const dbInstance = getCurrentInstance()
    return await dbInstance.getOrderManager().getOrderEvents(orderId)
  })

  // getIncrementalOrderEvents
  ipcMain.handle(
    'order:getIncrementalOrderEvents',
    async (event, lastEventId) => {
      const dbInstance = getCurrentInstance()
      return await dbInstance
        .getOrderManager()
        .getIncrementalOrderEvents(lastEventId)
    }
  )

  // getOrderEventsByPage
  ipcMain.handle(
    'order:getOrderEventsByPage',
    async (event, chainId, page, limit, sort, status, search) => {
      const dbInstance = getCurrentInstance()
      return await dbInstance
        .getOrderManager()
        .getOrderEventsByPage(chainId, page, limit, sort, status, search)
    }
  )
}

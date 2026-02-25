import { ipcMain } from 'electron'
import dbInstance from '../database'

export const registerOrderHandlers = () => {
  ipcMain.handle('order:createOrder', async (event, orderDto) => {
    await dbInstance.getOrderManager().createOrder(orderDto)
    return true
  })

  // cancelOrder
  ipcMain.handle('order:cancelOrder', async (event, cancelOrderDto) => {
    await dbInstance.getOrderManager().cancelOrder(cancelOrderDto)
    return true
  })

  // updateOrderPrice
  ipcMain.handle('order:updateOrderPrice', async (event, updatePriceDto) => {
    await dbInstance.getOrderManager().updateOrderPrice(updatePriceDto)
    return true
  })

  // getAllOrders
  ipcMain.handle(
    'order:getAllOrders',
    async (event, chainId, page, limit, sort, status, search) => {
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
    return await dbInstance.getOrderManager().getOrderById(orderId)
  })

  // getAssetPairs
  ipcMain.handle('order:getAssetPairs', async (event, chainId) => {
    return await dbInstance.getOrderManager().getAssetPairs(chainId)
  })

  // getOrderEvents
  ipcMain.handle('order:getOrderEvents', async (event, orderId) => {
    return await dbInstance.getOrderManager().getOrderEvents(orderId)
  })

  // getIncrementalOrderEvents
  ipcMain.handle(
    'order:getIncrementalOrderEvents',
    async (event, lastEventId) => {
      return await dbInstance
        .getOrderManager()
        .getIncrementalOrderEvents(lastEventId)
    }
  )

  // getOrderEventsByPage
  ipcMain.handle(
    'order:getOrderEventsByPage',
    async (event, chainId, page, limit, sort, status, search) => {
      return await dbInstance
        .getOrderManager()
        .getOrderEventsByPage(chainId, page, limit, sort, status, search)
    }
  )
}

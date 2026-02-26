import { DarkSwapError } from '@thesingularitynetwork/darkswap-sdk'
import { WalletMutexService } from './common/mutex/walletMutex.service'
import { OrderEventService } from './orders/orderEvent.service'
import {
  CancelOrderDto,
  OrderDto,
  OrderEventDto,
  OrderRetailDto,
  OrderType,
  UpdatePriceDto
} from './types'
import { DarkSwapContext } from './common/context/darkSwap.context'
import { RpcManager } from './common/rpcManager'
import { OrderRetailService } from './orders/orderRetail.service'

export class OrderRetailManager {
  private walletMutexService: WalletMutexService
  private orderRetailService: OrderRetailService
  private orderEventService: OrderEventService
  private rpcManager: RpcManager
  private statusCheckInterval: NodeJS.Timeout | null = null
  private readonly STATUS_CHECK_INTERVAL_MS = 15000 // 15 seconds

  constructor(
    orderRetailService: OrderRetailService,
    orderEventService: OrderEventService,
    rpcManager: RpcManager
  ) {
    this.walletMutexService = WalletMutexService.getInstance()
    this.orderRetailService = orderRetailService
    this.orderEventService = orderEventService
    this.rpcManager = rpcManager
  }

  /**
   * Start periodic status check for retail orders
   */
  public startStatusCheck(): void {
    if (this.statusCheckInterval) {
      console.log('Status check is already running')
      return
    }

    console.log('Starting retail order status check (every 15 seconds)')
    this.statusCheckInterval = setInterval(async () => {
      await this.checkAndUpdateOrderStatuses()
    }, this.STATUS_CHECK_INTERVAL_MS)

    // Run immediately on start
    this.checkAndUpdateOrderStatuses().catch((error) => {
      console.error('Error during initial status check:', error)
    })
  }

  /**
   * Stop periodic status check
   */
  public stopStatusCheck(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval)
      this.statusCheckInterval = null
      console.log('Stopped retail order status check')
    }
  }

  /**
   * Check and update statuses for all active orders
   */
  private async checkAndUpdateOrderStatuses(): Promise<void> {
    try {
      console.log('Checking retail order statuses...')
      await this.orderRetailService.syncOrderStatuses()
      console.log('Order status check completed')
    } catch (error) {
      console.error('Error checking order statuses:', error)
    }
  }

  public async createOrder(orderDto: OrderRetailDto): Promise<void> {
    if (orderDto.orderId) {
      const order = await this.orderRetailService.getOrderById(orderDto.orderId)
      if (order) {
        throw new DarkSwapError('Duplicate Order ID')
      }
    }

    if (
      orderDto.orderType === OrderType.STOP_LOSS_LIMIT ||
      orderDto.orderType === OrderType.STOP_LOSS ||
      orderDto.orderType === OrderType.TAKE_PROFIT ||
      orderDto.orderType === OrderType.TAKE_PROFIT_LIMIT
    ) {
      if (
        !orderDto.orderTriggerPrice ||
        isNaN(Number(orderDto.orderTriggerPrice)) ||
        Number(orderDto.orderTriggerPrice) <= 0
      ) {
        throw new DarkSwapError(
          'Order trigger price is required for stop loss or take profit orders'
        )
      }
    }

    const context = await DarkSwapContext.createDarkSwapContext(
      orderDto.chainId,
      orderDto.wallet,
      this.rpcManager
    )
    const mutex = this.walletMutexService.getMutex(
      context.chainId,
      context.walletAddress.toLowerCase()
    )
    await mutex.runExclusive(async () => {
      await this.orderRetailService.createOrder(orderDto, context)
    })
  }

  public async cancelOrder(cancelOrderDto: CancelOrderDto) {
    const context = await DarkSwapContext.createDarkSwapContext(
      cancelOrderDto.chainId,
      cancelOrderDto.wallet,
      this.rpcManager
    )

    const mutex = this.walletMutexService.getMutex(
      context.chainId,
      context.walletAddress.toLowerCase()
    )
    await mutex.runExclusive(async () => {
      await this.orderRetailService.cancelOrder(cancelOrderDto.orderId, context)
    })
  }

  public async updateOrderPrice(updatePriceDto: UpdatePriceDto) {
    await this.orderRetailService.updateOrderPrice(updatePriceDto)
  }

  public getAllOrders(status: number, page: number, limit: number) {
    return this.orderRetailService.getOrdersByStatusAndPage(status, page, limit)
  }

  public async getOrderById(orderId: string): Promise<OrderDto | null> {
    return await this.orderRetailService.getOrderById(orderId)
  }

  public async getAssetPairs(chainId: number) {
    return this.orderRetailService.getAssetPairs(chainId)
  }

  public async getOrderEvents(orderId: string): Promise<OrderEventDto[]> {
    return await this.orderEventService.getOrderEvents(orderId)
  }

  public async getIncrementalOrderEvents(
    lastEventId: number
  ): Promise<OrderEventDto[]> {
    return await this.orderEventService.getIncrementalOrderEvents(lastEventId)
  }

  public async getOrdersByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orders: OrderDto[]; total: number }> {
    return await this.orderRetailService.getOrdersByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
  }

  public async getOrderEventsByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orderEvents: OrderEventDto[]; total: number }> {
    return await this.orderEventService.getOrderEventsByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
  }
}

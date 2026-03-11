import { DarkSwapMessage } from '@thesingularitynetwork/darkswap-sdk'
import { DarkSwapContext } from './common/context/darkSwap.context'
import { WalletMutexService } from './common/mutex/walletMutex.service'
import { RpcManager } from './common/rpcManager'
import { OrderEventService } from './orders/orderEvent.service'
import { OrderRetailService } from './orders/orderRetail.service'
import {
  CancelOrderDto,
  OrderDto,
  OrderEventDto,
  OrderRetailDto
} from './types'

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
    const order = await this.orderRetailService.getRetailOrderById(orderDto.orderId)
    if (order) {
      orderDto = order
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

  public async withdrawOrder(chainId: number, wallet: string, swapMessage: DarkSwapMessage) {
    const context = await DarkSwapContext.createDarkSwapContext(
      chainId,
      wallet,
      this.rpcManager
    )

    const mutex = this.walletMutexService.getMutex(
      context.chainId,
      context.walletAddress.toLowerCase()
    )
    await mutex.runExclusive(async () => {
      await this.orderRetailService.withdrawRetailOrder(context, swapMessage)
    })
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

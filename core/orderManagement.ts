import { DarkSwapError } from '@thesingularitynetwork/darkswap-sdk'
import { WalletMutexService } from './common/mutex/walletMutex.service'
import { OrderService } from './orders/order.service'
import { OrderEventService } from './orders/orderEvent.service'
import {
  CancelOrderDto,
  OrderDto,
  OrderEventDto,
  OrderType,
  UpdatePriceDto
} from './types'
import { DarkSwapContext } from './common/context/darkSwap.context'
import { RpcManager } from './common/rpcManager'

export class OrderManager {
  private walletMutexService: WalletMutexService
  private orderService: OrderService
  private orderEventService: OrderEventService
  private rpcManager: RpcManager

  constructor(
    orderService: OrderService,
    orderEventService: OrderEventService,
    rpcManager: RpcManager
  ) {
    this.walletMutexService = WalletMutexService.getInstance()
    this.orderService = orderService
    this.orderEventService = orderEventService
    this.rpcManager = rpcManager
  }

  public async createOrder(orderDto: OrderDto): Promise<void> {
    if (orderDto.orderId) {
      const order = await this.orderService.getOrderById(orderDto.orderId)
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
      await this.orderService.createOrder(orderDto, context)
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
      await this.orderService.cancelOrder(cancelOrderDto.orderId, context)
    })
  }

  public async updateOrderPrice(updatePriceDto: UpdatePriceDto) {
    await this.orderService.updateOrderPrice(updatePriceDto)
  }

  public getAllOrders(status: number, page: number, limit: number) {
    return this.orderService.getOrdersByStatusAndPage(status, page, limit)
  }

  public async getOrderById(orderId: string): Promise<OrderDto | null> {
    return await this.orderService.getOrderById(orderId)
  }

  public async getAssetPairs(chainId: number) {
    return this.orderService.getAssetPairs(chainId)
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
    return await this.orderService.getOrdersByPage(
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

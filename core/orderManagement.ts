import { WalletMutexService } from './common/mutex/walletMutex.service'
import { RpcManager } from './common/rpcManager'
import { OrderService } from './orders/order.service'
import { OrderEventService } from './orders/orderEvent.service'
import {
  OrderDto,
  OrderEventDto
} from './types'

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

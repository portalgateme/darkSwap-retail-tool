import { Logger } from 'tslog'
import { DatabaseService } from '../common/db/database.service'
import { OrderEventDto, OrderStatus } from '../types'

export class OrderEventService {
  private readonly logger = new Logger({ name: OrderEventService.name })
  private dbService: DatabaseService

  public constructor(dbService: DatabaseService) {
    this.dbService = dbService
  }

  public async logOrderStatusChange(
    orderId: string,
    wallet: string,
    chainId: number,
    status: OrderStatus
  ): Promise<void> {
    await this.dbService.addOrderEvent(chainId, orderId, wallet, status)
    this.logger.info(`Order event logged: ${orderId} - ${OrderStatus[status]}`)
  }

  public async getOrderEvents(orderId: string): Promise<OrderEventDto[]> {
    return await this.dbService.getOrderEventsByOrderId(orderId)
  }

  public async getIncrementalOrderEvents(
    lastEventId: number
  ): Promise<OrderEventDto[]> {
    return await this.dbService.getIncrementalOrderEvents(lastEventId)
  }

  public async getOrderEventsByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orderEvents: OrderEventDto[]; total: number }> {
    return await this.dbService.getOrderEventsByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
  }
}

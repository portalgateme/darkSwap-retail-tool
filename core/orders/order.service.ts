import {
  DarkSwapError
} from '@thesingularitynetwork/darkswap-sdk'
import { Logger } from 'tslog'
import { DatabaseService } from '../common/db/database.service'
import { NoteService } from '../common/note.service'
import { NotesJoinService } from '../common/notesJoin.service'
import { RpcManager } from '../common/rpcManager'
import {
  AssetPairDto,
  OrderDto,
  OrderStatus
} from '../types'
import { OrderEventService } from './orderEvent.service'

export class OrderService {
  private readonly logger = new Logger({ name: OrderService.name })

  private dbService: DatabaseService
  private noteService: NoteService
  private notesJoinService: NotesJoinService
  private orderEventService: OrderEventService
  private rpcManager: RpcManager

  public constructor(
    dbService: DatabaseService,
    noteService: NoteService,
    notesJoinService: NotesJoinService,
    orderEventService: OrderEventService,
    rpcManager: RpcManager
  ) {
    this.dbService = dbService
    this.noteService = noteService
    this.notesJoinService = notesJoinService
    this.rpcManager = rpcManager
    this.orderEventService = orderEventService
  }

  async triggerOrder(orderInfo: OrderDto) {
    if (!orderInfo) {
      throw new DarkSwapError('Order not found')
    }

    this.dbService.updateOrderTriggered(orderInfo.orderId)

    await this.orderEventService.logOrderStatusChange(
      orderInfo.orderId,
      orderInfo.wallet,
      orderInfo.chainId,
      OrderStatus.TRIGGERED
    )
  }

  async getOrdersByStatusAndPage(
    status: number,
    page: number,
    limit: number
  ): Promise<OrderDto[]> {
    return await this.dbService.getOrdersByStatusAndPage(status, page, limit)
  }

  async getOrderById(orderId: string): Promise<OrderDto | null> {
    return await this.dbService.getOrderByOrderId(orderId)
  }

  async getAssetPairs(chainId: number): Promise<AssetPairDto[]> {
    const assetPairs = await this.dbService.getAssetPairs(chainId)
    return assetPairs
  }

  async getOrdersByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orders: OrderDto[]; total: number }> {
    return await this.dbService.getOrdersByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
  }
}

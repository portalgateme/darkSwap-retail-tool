import {
  DarkSwapOrderNote,
  DarkSwapError,
  RetailCreateOrderService,
  RetailCancelOrderService,
  serializeDarkSwapMessage,
  deserializeDarkSwapMessage
} from '@thesingularitynetwork/darkswap-sdk'
import { v4 } from 'uuid'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { DatabaseService } from '../common/db/database.service'
import { getConfirmations } from '../config/networkConfig'
import {
  AssetPairDto,
  CancelOrderDto,
  NoteStatus,
  OrderDirection,
  OrderDto,
  OrderNoteStatus,
  OrderRetailDto,
  OrderStatus,
  OrderType,
  UpdatePriceDto
} from '../types'
import { OrderEventService } from './orderEvent.service'
import { NoteService } from '../common/note.service'
import { Logger } from 'tslog'
import { RpcManager } from '../common/rpcManager'
import { checkPrice } from '../utils/priceUtil'
import { getBalance } from '../utils/getBalance'
import { getAuthInfo } from '../auth/authInfo.service'

export class OrderRetailService {
  private readonly logger = new Logger({ name: OrderRetailService.name })

  private dbService: DatabaseService
  private orderEventService: OrderEventService
  private noteService: NoteService
  private rpcManager: RpcManager

  public constructor(
    dbService: DatabaseService,
    orderEventService: OrderEventService,
    rpcManager: RpcManager,
    noteService: NoteService
  ) {
    this.dbService = dbService
    this.rpcManager = rpcManager
    this.orderEventService = orderEventService
    this.noteService = noteService
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

  async createOrder(
    orderDto: OrderRetailDto,
    darkSwapContext: DarkSwapContext
  ) {
    const assetPair = await this.dbService.getAssetPairById(
      orderDto.assetPairId,
      orderDto.chainId
    )

    if (!assetPair) {
      throw new DarkSwapError('Asset pair not found')
    }

    const amountQuote =
      orderDto.orderDirection === OrderDirection.BUY
        ? BigInt(orderDto.amountOut)
        : BigInt(orderDto.amountIn)
    const amountBase =
      orderDto.orderDirection === OrderDirection.BUY
        ? BigInt(orderDto.amountIn)
        : BigInt(orderDto.amountOut)

    if (
      !checkPrice(
        amountBase,
        amountQuote,
        assetPair.baseDecimal,
        assetPair.quoteDecimal,
        Number(orderDto.price)
      )
    ) {
      throw new DarkSwapError('Price not match with amountOut and amountIn')
    }

    const outAsset =
      orderDto.orderDirection === OrderDirection.BUY
        ? assetPair.quoteAddress
        : assetPair.baseAddress
    const inAsset =
      orderDto.orderDirection === OrderDirection.BUY
        ? assetPair.baseAddress
        : assetPair.quoteAddress

    const currentBalance = await getBalance(
      outAsset,
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      darkSwapContext.darkSwap.provider
    )
    if (currentBalance < BigInt(orderDto.amountOut)) {
      throw new DarkSwapError(`Insufficient Asset ${outAsset}`)
    }

    const retailCreateOrderService = new RetailCreateOrderService(
      darkSwapContext.darkSwap
    )
    const { context, swapMessage } = await retailCreateOrderService.prepare(
      darkSwapContext.walletAddress,
      outAsset,
      BigInt(orderDto.amountOut),
      inAsset,
      BigInt(orderDto.amountIn),
      darkSwapContext.signature
    )
    // this.noteService.addNote(swapMessage.orderNote, darkSwapContext, true)
    // if (newBalance.amount > 0n) {
    //   this.noteService.addNote(newBalance, darkSwapContext, false)
    // }

    // this.noteService.setNoteActive(swapMessage.orderNote, darkSwapContext, tx)

    if (!orderDto.orderId) {
      orderDto.orderId = v4()
    }

    if (
      orderDto.orderType === OrderType.STOP_LOSS_LIMIT ||
      orderDto.orderType === OrderType.STOP_LOSS ||
      orderDto.orderType === OrderType.TAKE_PROFIT ||
      orderDto.orderType === OrderType.TAKE_PROFIT_LIMIT
    ) {
      orderDto.status = OrderStatus.NOT_TRIGGERED
    } else {
      orderDto.status = OrderStatus.OPEN
    }

    orderDto.noteCommitment = swapMessage.orderNote.note.toString()
    orderDto.nullifier = swapMessage.orderNullifier.toString()
    orderDto.feeRatio = swapMessage.orderNote.feeRatio.toString()
    orderDto.publicKey = darkSwapContext.publicKey

    const orderRetailDto: OrderRetailDto = {
      ...orderDto,
      swapMessage: serializeDarkSwapMessage(swapMessage)
    }

    await this.dbService.addRetailOrderByDto(orderRetailDto)

    const tx = await retailCreateOrderService.execute(context)
    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Order creation failed')
    }

    await this.dbService.updateTxCreatedRetailOrderByDto(
      orderRetailDto.orderId!,
      tx
    )

    delete orderDto.noteCommitment

    delete orderRetailDto.orderId
    delete orderRetailDto.partialAmountIn
    delete orderRetailDto.publicKey

    await this.orderEventService.logOrderStatusChange(
      orderDto.orderId,
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      orderDto.status
    )

    this.logger.info(
      `Order created: ${
        orderDto.orderDirection === OrderDirection.BUY ? 'BUY' : 'SELL'
      } ${orderDto.orderId} ${orderDto.assetPairId} OUT: ${
        orderDto.amountOut
      } IN: ${orderDto.amountIn}`
    )
  }

  async updateOrderPrice(updatePriceDto: UpdatePriceDto) {
    const order = await this.dbService.getOrderByOrderId(updatePriceDto.orderId)
    if (!order) {
      throw new DarkSwapError('Order not found')
    } else if (order.status != OrderStatus.OPEN) {
      throw new DarkSwapError('Order is not in open status')
    }

    const assetPair = await this.dbService.getAssetPairById(
      order.assetPairId,
      order.chainId
    )
    if (!assetPair) {
      throw new DarkSwapError('Asset pair not found')
    }

    const amountQuote =
      order.orderDirection === OrderDirection.BUY
        ? BigInt(order.amountOut)
        : BigInt(updatePriceDto.amountIn)
    const amountBase =
      order.orderDirection === OrderDirection.BUY
        ? BigInt(updatePriceDto.amountIn)
        : BigInt(order.amountOut)

    if (
      !checkPrice(
        amountBase,
        amountQuote,
        assetPair.baseDecimal,
        assetPair.quoteDecimal,
        Number(updatePriceDto.price)
      )
    ) {
      throw new DarkSwapError('Price not match with amountOut and amountIn')
    }

    // await this.bookNodeService.updateOrderPrice(updatePriceDto)
    await this.dbService.updateOrderPrice(
      updatePriceDto.orderId,
      updatePriceDto.price,
      BigInt(updatePriceDto.amountIn),
      BigInt(updatePriceDto.partialAmountIn)
    )
    return true
  }

  // Method to cancel an order
  async cancelOrder(
    orderId: string,
    darkSwapContext: DarkSwapContext,
    byNotification: boolean = false
  ) {
    const order = await this.dbService.getRetailOrderByOrderId(orderId)
    if (!order) {
      throw new DarkSwapError('Order not found')
    }

    if (
      order.status !== OrderStatus.OPEN &&
      order.status !== OrderStatus.NOT_TRIGGERED
    ) {
      throw new DarkSwapError('Order is not cancellable')
    }

    const note = deserializeDarkSwapMessage(order.swapMessage!).orderNote

    const noteToProcess = {
      note: note.note,
      rho: note.rho,
      asset: note.asset,
      amount: note.amount,
      feeRatio: BigInt(order.feeRatio)
    } as DarkSwapOrderNote

    const retailCancelOrderService = new RetailCancelOrderService(
      darkSwapContext.darkSwap
    )

    const { context } = await retailCancelOrderService.prepare(
      darkSwapContext.walletAddress,
      noteToProcess,
      darkSwapContext.signature
    )

    const tx = await retailCancelOrderService.execute(context)
    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Order cancellation failed')
    }

    // this.noteService.setNoteUsed(noteToProcess as DarkSwapNote, darkSwapContext)

    const cancelOrderDto = {
      orderId: orderId,
      chainId: darkSwapContext.chainId,
      wallet: darkSwapContext.walletAddress
    } as CancelOrderDto

    await this.dbService.cancelOrder(cancelOrderDto.orderId)
    // if (!byNotification) {
    //   const authInfo = await getAuthInfo(darkSwapContext)
    //   await this.bookNodeService.cancelOrder(cancelOrderDto, authInfo)
    // }

    await this.orderEventService.logOrderStatusChange(
      orderId,
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      OrderStatus.CANCELLED
    )
  }

  async cancelOrderByNotificaion(orderInfo: OrderDto) {
    const darkSwapContext = await DarkSwapContext.createDarkSwapContext(
      orderInfo.chainId,
      orderInfo.wallet,
      this.rpcManager
    )
    await this.cancelOrder(orderInfo.orderId, darkSwapContext, true)
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

  /**
   * Sync order statuses from blockchain for active orders
   */
  public async syncOrderStatuses(): Promise<void> {
    // Get all active orders (status = 0 or pending status)
    const activeOrders = await this.dbService.getRetailActiveOrders()

    for (const order of activeOrders) {
      try {
        const context = await DarkSwapContext.createDarkSwapContext(
          order.chainId,
          order.wallet,
          this.rpcManager
        )

        if (!order.swapMessage) {
          console.warn(
            `Order ${order.orderId} has no swap message, skipping status sync`
          )
          continue
        }

        const swapMessage = deserializeDarkSwapMessage(order.swapMessage)
        const orderNote = swapMessage.orderNote
        const inNote = swapMessage.inNote

        // Check order status on-chain
        const orderNoteStatus = await this.noteService.checkNoteByChain(
          orderNote,
          context.signature,
          order.chainId
        )

        const inNoteStatus = await this.noteService.checkNoteByChain(
          inNote,
          context.signature,
          order.chainId
        )

        const orderStatus =
          orderNoteStatus === OrderNoteStatus.VERFIED
            ? OrderStatus.OPEN
            : inNoteStatus === OrderNoteStatus.VERFIED
              ? OrderStatus.SETTLED
              : OrderStatus.MATCHED

        // Update if status changed
        if (order.status && orderStatus !== order.status && order.orderId) {
          await this.dbService.updateRetailOrderStatus(
            order.orderId,
            orderStatus
          )
          console.log(
            `Updated order ${order.orderId} status: ${order.status} -> ${orderStatus}`
          )
        }
      } catch (error) {
        console.error(`Error syncing status for order ${order.orderId}:`, error)
      }
    }
  }
}

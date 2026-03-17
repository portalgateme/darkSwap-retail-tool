import {
  createNoteCryptoContext,
  DarkSwapError,
  DarkSwapMessage,
  DEFAULT_VERSION,
  deriveKey,
  deserializeDarkSwapMessage,
  hexlify32,
  RetailCancelOrderService,
  RetailCreateOrderService,
  serializeDarkSwapMessage,
  WithdrawService
} from '@thesingularitynetwork/darkswap-sdk'
import { Logger } from 'tslog'
import { v4 } from 'uuid'
import { AssetManager } from '../assetManagement'
import { AgentService } from '../common/agent.service'
import { DarkSwapContext } from '../common/context/darkSwap.context'
import { DatabaseService } from '../common/db/database.service'
import { NoteService } from '../common/note.service'
import { RpcManager } from '../common/rpcManager'
import { SubgraphService } from '../common/subgraph.service'
import { getConfirmations } from '../config/networkConfig'
import {
  AssetPairDto,
  OrderDirection,
  OrderDto,
  OrderNoteStatus,
  OrderRetailDto,
  OrderStatus
} from '../types'
import { getBalance } from '../utils/getBalance'
import { checkPrice } from '../utils/priceUtil'
import { OrderEventService } from './orderEvent.service'

export class OrderRetailService {
  private readonly logger = new Logger({ name: OrderRetailService.name })

  private dbService: DatabaseService
  private orderEventService: OrderEventService
  private rpcManager: RpcManager
  private agentService: AgentService
  private subgraphService: SubgraphService
  private noteService: NoteService
  private assetManager: AssetManager

  public constructor(
    dbService: DatabaseService,
    orderEventService: OrderEventService,
    rpcManager: RpcManager,
    agentService: AgentService,
    subgraphService: SubgraphService,
    noteService: NoteService,
    assetManager: AssetManager
  ) {
    this.dbService = dbService
    this.rpcManager = rpcManager
    this.orderEventService = orderEventService
    this.agentService = agentService
    this.subgraphService = subgraphService
    this.noteService = noteService
    this.assetManager = assetManager
  }

  private async submitOrderToAgent(
    txHash: string,
    orderDto: OrderRetailDto,
    swapMessage: DarkSwapMessage,
    darkSwapContext: DarkSwapContext
  ) {
    if (orderDto.agentOrderId) {
      return
    }

    let agentOrderIdFromAgent = await this.agentService.getOrderByTxHash(
      orderDto.chainId,
      orderDto.wallet,
      txHash,
      darkSwapContext.signer
    )

    if (!agentOrderIdFromAgent) {
      const orderRetailDto: OrderRetailDto = {
        ...orderDto,
        txHashCreated: txHash,
        swapMessage: serializeDarkSwapMessage(swapMessage)
      }
      agentOrderIdFromAgent = await this.agentService.submitOrder(
        orderRetailDto.chainId,
        orderRetailDto,
        darkSwapContext.signer
      )
    }

    await this.dbService.updateAgentOrderIdOfRetailOrderById(
      orderDto.orderId!,
      agentOrderIdFromAgent
    )

    await this.orderEventService.logOrderStatusChange(
      orderDto.orderId!,
      darkSwapContext.walletAddress,
      darkSwapContext.chainId,
      OrderStatus.OPEN
    )

    this.logger.info(
      `Order created: ${orderDto.orderDirection === OrderDirection.BUY ? 'BUY' : 'SELL'
      } ${orderDto.orderId} ${orderDto.assetPairId} OUT: ${orderDto.amountOut
      } IN: ${orderDto.amountIn}`
    )
  }

  async createOrder(
    orderDto: OrderRetailDto,
    darkSwapContext: DarkSwapContext
  ) {
    if (!orderDto.orderId) {
      orderDto.orderId = v4()
    }

    const retailCreateOrderService = new RetailCreateOrderService(
      darkSwapContext.darkSwap
    )

    let context
    let swapMessage

    if (orderDto.swapMessage) {
      swapMessage = deserializeDarkSwapMessage(orderDto.swapMessage)

      const createOrderTx = await this.subgraphService.getCreateOrderTxByNote(
        orderDto.chainId,
        hexlify32(swapMessage.orderNote.note)
      )

      if (createOrderTx) {
        await this.submitOrderToAgent(
          createOrderTx,
          orderDto,
          swapMessage,
          darkSwapContext
        )
        return
      } else {
        const sig = darkSwapContext.getSignatureByMessageVersion(
          swapMessage.version
        )
        context =
          await retailCreateOrderService.rebuildContextFromSwapMessage(
            swapMessage,
            sig,
            darkSwapContext.cryptoContext
          )
      }
    } else {
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

      const sig = darkSwapContext.signatureV2
      const result = await retailCreateOrderService.prepare(
        darkSwapContext.walletAddress,
        outAsset,
        BigInt(orderDto.amountOut),
        inAsset,
        BigInt(orderDto.amountIn),
        sig,
        darkSwapContext.cryptoContext,
        DEFAULT_VERSION
      )
      context = result.context
      swapMessage = result.swapMessage
      orderDto.status = OrderStatus.OPEN
      orderDto.noteCommitment = swapMessage.orderNote.note.toString()
      orderDto.nullifier = swapMessage.orderNullifier.toString()
      orderDto.feeRatio = swapMessage.orderNote.feeRatio.toString()
      orderDto.publicKey = darkSwapContext.publicKey
      orderDto.swapMessage = serializeDarkSwapMessage(swapMessage)

      await this.dbService.addRetailOrderByDto(orderDto)
    }

    const tx = await retailCreateOrderService.execute(context)
    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Order creation failed')
    }

    await this.dbService.updateTxCreatedRetailOrderById(orderDto.orderId!, tx)

    await this.submitOrderToAgent(tx, orderDto, swapMessage, darkSwapContext)
  }

  // Method to cancel an order
  async cancelOrder(orderId: string, darkSwapContext: DarkSwapContext) {
    const order = await this.dbService.getRetailOrderByOrderId(orderId)
    if (!order) {
      throw new DarkSwapError('Order not found')
    }

    if (order.status !== OrderStatus.OPEN) {
      throw new DarkSwapError('Order is not cancellable')
    }

    const swapMessage = deserializeDarkSwapMessage(order.swapMessage!)

    const cancelTx = await this.subgraphService.getCancelTxByNote(
      order.chainId,
      order.nullifier!
    )

    if (!cancelTx) {
      const noteStatus = await this.noteService.checkNoteByPubkey(
        swapMessage.orderNote,
        order.publicKey!,
        order.chainId
      )

      if (noteStatus == OrderNoteStatus.USED) {
        throw new DarkSwapError('Order is not cancellable')
      }

      const retailCancelOrderService = new RetailCancelOrderService(
        darkSwapContext.darkSwap
      )

      const sig = darkSwapContext.getSignatureByMessageVersion(
        swapMessage.version
      )

      const { context } = await retailCancelOrderService.prepare(
        darkSwapContext.walletAddress,
        swapMessage.orderNote,
        sig
      )

      const tx = await retailCancelOrderService.execute(context)
      const receipt =
        await darkSwapContext.darkSwap.provider.waitForTransaction(
          tx,
          getConfirmations(darkSwapContext.chainId)
        )
      if (receipt && receipt.status !== 1) {
        throw new DarkSwapError('Order cancellation failed')
      }
    }

    if (order.agentOrderId) {
      await this.agentService.cancelOrder(
        darkSwapContext.chainId,
        darkSwapContext.walletAddress,
        order.agentOrderId!,
        darkSwapContext.signer
      )
    }

    await this.dbService.cancelOrder(orderId)
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

  async getRetailOrderById(orderId: string): Promise<OrderRetailDto | null> {
    return await this.dbService.getRetailOrderByOrderId(orderId)
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
    console.log(`Found ${activeOrders.length} active orders to sync`)

    for (const order of activeOrders) {
      try {
        if (
          !order.agentOrderId ||
          order.agentOrderId === '' ||
          !order.orderId
        ) {
          continue
        }

        const context = await DarkSwapContext.createDarkSwapContext(
          order.chainId,
          order.wallet,
          this.rpcManager
        )

        const orderFilled = await this.agentService.getOrderFilledByOrderId(
          order.chainId,
          order.agentOrderId,
          order.wallet,
          context.signer
        )
        console.log(`Order ${order.orderId} filled: ${orderFilled}`)

        // Update if status changed
        if (orderFilled) {
          await this.dbService.updateRetailOrderStatus(
            order.orderId,
            OrderStatus.SETTLED
          )
          await this.orderEventService.logOrderStatusChange(
            order.orderId,
            context.walletAddress,
            context.chainId,
            OrderStatus.SETTLED
          )
          console.log(
            `Updated order ${order.orderId} status: ${order.status} -> ${OrderStatus.SETTLED}`
          )
        }
      } catch (error) {
        console.error(`Error syncing status for order ${order.orderId}:`, error)
      }
    }
  }

  public async postWithdraw(chainId: number, wallet: string, agentOrderId: string) {
    const context = await DarkSwapContext.createDarkSwapContext(
      chainId,
      wallet,
      this.rpcManager
    )
    await this.agentService.finalizeOrder(chainId, wallet, agentOrderId, context.signer);
  }

  public async withdrawRetailOrder(darkSwapContext: DarkSwapContext, swapMessage: DarkSwapMessage) {
    const withdrawService = new WithdrawService(darkSwapContext.darkSwap)

    const sig = darkSwapContext.getSignatureByMessageVersion(swapMessage.version)

    const { context: withdrawContext } =
      await withdrawService.prepare(
        darkSwapContext.walletAddress,
        swapMessage.inNote,
        swapMessage.inNote.amount,
        sig
      )

    const tx = await withdrawService.execute(withdrawContext)

    const receipt = await darkSwapContext.darkSwap.provider.waitForTransaction(
      tx,
      getConfirmations(darkSwapContext.chainId)
    )
    if (receipt && receipt.status !== 1) {
      throw new DarkSwapError('Withdraw failed')
    }

    this.logger.info(
      `Withdraw of ${swapMessage.inNote.amount} ${swapMessage.inNote.asset} for wallet ${darkSwapContext.walletAddress} completed with tx ${withdrawContext.tx}`
    )
  }
}

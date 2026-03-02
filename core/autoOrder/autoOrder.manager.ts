import { calcNullifier, deserializeDarkSwapMessage, hexlify32 } from '@thesingularitynetwork/darkswap-sdk'
import { ethers } from 'ethers'
import { Logger } from 'tslog'
import { v4 } from 'uuid'
import { AssetManager } from '../assetManagement'
import { DatabaseService } from '../common/db/database.service'
import { OrderRetailService } from '../orders/orderRetail.service'
import { OrderRetailManager } from '../retailOrderManagement'
import {
  AutoOrderCycleState,
  AutoOrderJobDto,
  AutoOrderJobOrderDto,
  AutoOrderJobStatus,
  OrderDirection,
  OrderStatus,
  OrderType,
  SortType,
  WithdrawNoteDto
} from '../types'
import { SubgraphService } from '../common/subgraph.service'
import Orders from '../../renderer/pages/history'

const PRICE_DECIMALS = 18

export class AutoOrderManager {
  private readonly logger = new Logger({ name: AutoOrderManager.name })
  private dbService: DatabaseService
  private assetManager: AssetManager
  private orderRetailManager: OrderRetailManager
  private orderRetailService: OrderRetailService
  private subgraphService: SubgraphService
  private intervalTimer?: NodeJS.Timeout
  private isTicking = false
  private defaultIntervalSeconds = 15

  public constructor(
    dbService: DatabaseService,
    orderRetailManager: OrderRetailManager,
    assetManager: AssetManager,
    orderRetailService: OrderRetailService,
    subgraphService: SubgraphService
  ) {
    this.dbService = dbService
    this.orderRetailManager = orderRetailManager
    this.assetManager = assetManager
    this.orderRetailService = orderRetailService
    this.subgraphService = subgraphService
  }

  public start(intervalSeconds: number = this.defaultIntervalSeconds) {
    if (this.intervalTimer) {
      return
    }
    this.intervalTimer = setInterval(() => this.tick(), intervalSeconds * 1000)
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = undefined
    }
  }

  public async createJob(job: AutoOrderJobDto): Promise<AutoOrderJobDto> {
    if (!job.jobId) {
      job.jobId = v4()
    }

    if (!job.intervalSeconds || job.intervalSeconds <= 0) {
      job.intervalSeconds = this.defaultIntervalSeconds
    }

    if (!job.startAt || job.startAt <= 0) {
      job.startAt = Date.now()
    }

    if (job.endAt && job.endAt <= job.startAt) {
      throw new Error('endAt must be greater than startAt')
    }

    const minPrice = Number(job.minPrice)
    const maxPrice = Number(job.maxPrice)
    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
      throw new Error('minPrice and maxPrice must be valid numbers')
    }

    if (minPrice > maxPrice) {
      throw new Error('minPrice must be less than or equal to maxPrice')
    }

    if (
      job.orderType === OrderType.LIMIT
    ) {
      const limitPrice = Number(job.price)
      if (isNaN(limitPrice) || limitPrice <= 0) {
        throw new Error('price is required for limit orders')
      }
    } else {
      job.price = job.price || '0'
    }

    job.marketPrice = job.marketPrice || '0'

    const existing = await this.dbService.getAutoOrderJobByJobId(job.jobId)
    if (existing) {
      throw new Error('Duplicate jobId')
    }

    job.status = job.status ?? AutoOrderJobStatus.ACTIVE
    job.cycleState =
      job.orderDirection === OrderDirection.BUY
        ? AutoOrderCycleState.CREATE_BUY
        : AutoOrderCycleState.CREATE_SELL
    job.startDirection = job.orderDirection
    job.lastReceivedAmount = '0'

    console.log('Creating auto order job', job)

    await this.dbService.addAutoOrderJob(job)

    return job
  }

  public async updateJob(
    job: AutoOrderJobDto
  ): Promise<AutoOrderJobDto | null> {
    if (!job.jobId) {
      throw new Error('jobId is required')
    }

    const existing = await this.dbService.getAutoOrderJobByJobId(job.jobId)
    if (!existing) {
      throw new Error('Job not found')
    }

    if (
      existing.status === AutoOrderJobStatus.CANCELLED ||
      existing.status === AutoOrderJobStatus.COMPLETED
    ) {
      throw new Error('Job is not editable')
    }

    if (existing.activeOrderId) {
      throw new Error('Job has an active order and cannot be edited')
    }

    const merged: AutoOrderJobDto = {
      ...existing,
      ...job
    }

    if (!merged.intervalSeconds || merged.intervalSeconds <= 0) {
      merged.intervalSeconds = this.defaultIntervalSeconds
    }

    if (!merged.startAt || merged.startAt <= 0) {
      merged.startAt = Date.now()
    }

    if (merged.endAt && merged.endAt <= merged.startAt) {
      throw new Error('endAt must be greater than startAt')
    }

    const minPrice = Number(merged.minPrice)
    const maxPrice = Number(merged.maxPrice)
    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
      throw new Error('minPrice and maxPrice must be valid numbers')
    }

    if (minPrice > maxPrice) {
      throw new Error('minPrice must be less than or equal to maxPrice')
    }

    if (
      merged.orderType === OrderType.LIMIT ||
      merged.orderType === OrderType.LIMIT_MAKER
    ) {
      const limitPrice = Number(merged.price)
      if (isNaN(limitPrice) || limitPrice <= 0) {
        throw new Error('price is required for limit orders')
      }
    } else {
      merged.price = merged.price || '0'
    }

    merged.marketPrice = merged.marketPrice || '0'

    await this.dbService.updateAutoOrderJob(merged)

    return await this.dbService.getAutoOrderJobByJobId(merged.jobId)
  }

  public async pauseJob(jobId: string) {
    await this.dbService.updateAutoOrderJobStatus(
      jobId,
      AutoOrderJobStatus.PAUSED
    )
  }

  public async resumeJob(jobId: string) {
    await this.dbService.updateAutoOrderJobStatus(
      jobId,
      AutoOrderJobStatus.ACTIVE
    )
  }

  public async cancelJob(jobId: string) {
    await this.dbService.updateAutoOrderJobStatus(
      jobId,
      AutoOrderJobStatus.CANCELLED
    )
  }

  public async updateMarketPrice(
    chainId: number,
    assetPairId: string,
    marketPrice: string
  ) {
    await this.dbService.updateAutoOrderJobsMarketPrice(
      chainId,
      assetPairId,
      marketPrice
    )
  }

  public async getJob(jobId: string): Promise<AutoOrderJobDto | null> {
    return await this.dbService.getAutoOrderJobByJobId(jobId)
  }

  public async getJobsByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string = SortType.NEWEST,
    status?: number,
    search?: string
  ): Promise<{ jobs: AutoOrderJobDto[]; total: number }> {
    return await this.dbService.getAutoOrderJobsByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
  }

  private async tick() {
    if (this.isTicking) {
      return
    }

    this.isTicking = true
    try {
      const jobs = await this.dbService.getAutoOrderJobsByStatus(
        AutoOrderJobStatus.ACTIVE
      )

      if (!jobs.length) return

      const now = Date.now()

      for (const job of jobs) {
        try {
          if (
            job.lastRunAt &&
            now - job.lastRunAt < job.intervalSeconds * 1000
          ) {
            continue
          }

          await this.dbService.updateAutoOrderJobLastRun(job.jobId, now)

          if (job.startAt && now < job.startAt) {
            continue
          }

          if (job.endAt && now > job.endAt) {
            if (!job.activeOrderId) {
              await this.dbService.updateAutoOrderJobStatus(
                job.jobId,
                AutoOrderJobStatus.COMPLETED
              )
            }
            continue
          }

          // Initialize cycle state if not set
          let cycleState = job.cycleState
          if (!cycleState) {
            // Determine starting cycle state based on startDirection
            const startDirection = job.startDirection ?? OrderDirection.SELL
            cycleState =
              startDirection === OrderDirection.BUY
                ? AutoOrderCycleState.CREATE_BUY
                : AutoOrderCycleState.CREATE_SELL
          }

          await this.processCycleState(job, cycleState, now)
        } catch (error) {
          this.logger.error(`Auto order job failed: ${job.jobId}`, error)
          await this.pauseJob(job.jobId)
        }
      }
    } catch (error) {
      this.logger.error('Auto order tick failed', error)
    } finally {
      this.isTicking = false
    }
  }

  private async processCycleState(
    job: AutoOrderJobDto,
    cycleState: AutoOrderCycleState,
    now: number
  ) {
    const assetPair = await this.dbService.getAssetPairById(
      job.assetPairId,
      job.chainId
    )
    if (!assetPair) {
      this.logger.warn(
        `Asset pair not found for job ${job.jobId}: ${job.assetPairId}`
      )
      return
    }


    switch (cycleState) {
      case AutoOrderCycleState.CREATE_SELL:
        await this.handleCreateSell(job, assetPair, now)
        break
      case AutoOrderCycleState.WAIT_SELL:
        await this.handleWaitSell(job, now)
        break
      case AutoOrderCycleState.WITHDRAW_SELL:
        await this.handleWithdraw(job, now, AutoOrderCycleState.CREATE_BUY)
        break
      case AutoOrderCycleState.CREATE_BUY:
        await this.handleCreateBuy(job, assetPair, now)
        break
      case AutoOrderCycleState.WAIT_BUY:
        await this.handleWaitBuy(job, now)
        break
      case AutoOrderCycleState.WITHDRAW_BUY:
        await this.handleWithdraw(job, now, AutoOrderCycleState.CREATE_SELL)
        break
    }
  }

  private async handleCreateSell(
    job: AutoOrderJobDto,
    assetPair: any,
    now: number
  ) {
    if (job.orderDirection !== OrderDirection.SELL) {
      // Skip if not selling in this cycle
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_BUY,
        now
      )
      return
    }

    let orderDto = undefined
    let orderId: string
    if (job.activeOrderId) {
      orderId = job.activeOrderId
      const tmpOrderDto = await this.orderRetailService.getRetailOrderById(job.activeOrderId)
      if (tmpOrderDto) {
        orderDto = tmpOrderDto
      }
    } else {
      orderId = v4()
      await this.dbService.updateAutoOrderJobActiveOrder(
        job.jobId,
        orderId,
        null
      )
    }

    if (!orderDto) {
      // Create sell order
      const orderPrice = await this.getOrderPrice(job)
      if (!orderPrice) return

      // Use lastReceivedAmount as amountOut for sell order if available
      let sellAmountOut = job.amountOut
      const amountFromLastOrder = await this.getAmountFromLastOrder(job)
      if (amountFromLastOrder) {
        sellAmountOut = amountFromLastOrder
      } else if (job.lastReceivedAmount && job.lastReceivedAmount !== '0') {
        sellAmountOut = job.lastReceivedAmount
      }

      const sellJob = { ...job, amountOut: sellAmountOut }

      const { amountOutRaw, amountInRaw } = this.computeOrderAmounts(
        sellJob,
        assetPair.baseDecimal,
        assetPair.quoteDecimal,
        orderPrice
      )

      if (amountInRaw <= 0n || amountOutRaw <= 0n) {
        return
      }

      orderDto = {
        orderId: orderId,
        wallet: job.wallet,
        chainId: job.chainId,
        assetPairId: job.assetPairId,
        orderDirection: OrderDirection.SELL,
        orderType: job.orderType,
        timeInForce: job.timeInForce,
        stpMode: job.stpMode,
        price: orderPrice,
        amountOut: amountOutRaw.toString(),
        amountIn: amountInRaw.toString(),
        partialAmountIn: amountInRaw.toString(),
        feeRatio: job.feeRatio
      }
    }

    await this.orderRetailManager.createOrder(orderDto)

    const log: AutoOrderJobOrderDto = {
      jobId: job.jobId,
      orderId: orderId,
      chainId: job.chainId,
      wallet: job.wallet
    }

    await this.dbService.addAutoOrderJobOrder(log)
    await this.dbService.updateAutoOrderJobLastOrder(
      job.jobId,
      orderId
    )
    await this.updateCycleState(job.jobId, AutoOrderCycleState.WAIT_SELL, now)
  }

  private async handleWaitSell(job: AutoOrderJobDto, now: number) {
    if (!job.activeOrderId) {
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_SELL,
        now
      )
      return
    }

    const order = await this.dbService.getRetailOrderByOrderId(
      job.activeOrderId
    )

    if (!order) {
      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_SELL,
        now
      )
      return
    }

    if (order.status === OrderStatus.SETTLED) {
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.WITHDRAW_SELL,
        now
      )
      this.logger.info(
        `[Auto Order Cycle] Job ${job.jobId} SELL order ${order.orderId} settled`
      )
      return
    }

    if (order.status === OrderStatus.CANCELLED) {
      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_SELL,
        now
      )
      this.logger.warn(
        `[Auto Order Cycle] Job ${job.jobId} SELL order ${order.orderId} cancelled`
      )
      return
    }

    // Still waiting for order to settle
  }

  private async handleWithdraw(job: AutoOrderJobDto, now: number, nextCycleState: AutoOrderCycleState) {
    if (!job.activeOrderId) {
      await this.updateCycleState(
        job.jobId,
        nextCycleState,
        now
      )
      return
    }

    const order = await this.dbService.getRetailOrderByOrderId(
      job.activeOrderId
    )

    if (!order) {
      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)
      await this.updateCycleState(
        job.jobId,
        nextCycleState,
        now
      )
      return
    }

    if (order.status === OrderStatus.SETTLED) {
      const swapMessage = deserializeDarkSwapMessage(order.swapMessage!)

      const nullifier = calcNullifier(swapMessage.inNote.rho, swapMessage.publicKey)

      // Check if withdraw tx already exists
      const withdrawTx = await this.subgraphService.getWithdrawTxByNote(
        order.chainId,
        hexlify32(nullifier)
      )
      if (!withdrawTx) {
        const withdrawNoteDto: WithdrawNoteDto = {
          chainId: order.chainId,
          wallet: order.wallet,
          note: swapMessage.inNote
        }

        await this.assetManager.withdrawNote(withdrawNoteDto)
      }

      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)

      // Save received amount for next order
      job.lastReceivedAmount = order.amountIn
      await this.updateCycleStateWithAmount(
        job.jobId,
        nextCycleState,
        order.amountIn,
        now
      )

      this.logger.info(
        `[Auto Order Cycle] Job ${job.jobId} withdrawn SELL proceeds from ${order.orderId}, received ${order.amountIn}`
      )
    }
  }

  private async handleCreateBuy(
    job: AutoOrderJobDto,
    assetPair: any,
    now: number
  ) {
    if (job.orderDirection === OrderDirection.SELL) {
      // Need to flip direction for buy order
      const tempJob = { ...job, orderDirection: OrderDirection.BUY }

      let orderDto = undefined
      let orderId: string
      if (job.activeOrderId) {
        orderId = job.activeOrderId
        const tmpOrderDto = await this.orderRetailService.getRetailOrderById(job.activeOrderId)
        if (tmpOrderDto) {
          orderDto = tmpOrderDto
        }
      } else {
        orderId = v4()
        await this.dbService.updateAutoOrderJobActiveOrder(
          job.jobId,
          orderId,
          null
        )
      }

      if (!orderDto) {
        const orderPrice = await this.getOrderPrice(tempJob)
        if (!orderPrice) return

        // Use lastReceivedAmount as amountOut for buy order if available
        let buyAmountOut = job.amountOut
        const amountFromLastOrder = await this.getAmountFromLastOrder(job)
        if (amountFromLastOrder) {
          buyAmountOut = amountFromLastOrder
        } else {

        }
        const buyTempJob = { ...tempJob, amountOut: buyAmountOut }

        const { amountOutRaw, amountInRaw } = this.computeOrderAmounts(
          buyTempJob,
          assetPair.baseDecimal,
          assetPair.quoteDecimal,
          orderPrice
        )

        if (amountInRaw <= 0n || amountOutRaw <= 0n) {
          return
        }

        orderDto = {
          orderId: orderId,
          wallet: job.wallet,
          chainId: job.chainId,
          assetPairId: job.assetPairId,
          orderDirection: OrderDirection.BUY,
          orderType: job.orderType,
          timeInForce: job.timeInForce,
          stpMode: job.stpMode,
          price: orderPrice,
          amountOut: amountOutRaw.toString(),
          amountIn: amountInRaw.toString(),
          partialAmountIn: amountInRaw.toString(),
          feeRatio: job.feeRatio
        }
      }

      await this.orderRetailManager.createOrder(orderDto)

      const log: AutoOrderJobOrderDto = {
        jobId: job.jobId,
        orderId: orderId,
        chainId: job.chainId,
        wallet: job.wallet
      }

      await this.dbService.addAutoOrderJobOrder(log)
      await this.dbService.updateAutoOrderJobLastOrder(
        job.jobId,
        orderId
      )
      await this.updateCycleState(job.jobId, AutoOrderCycleState.WAIT_BUY, now)

      this.logger.info(
        `[Auto Order Cycle] Job ${job.jobId} created BUY order ${orderDto.orderId} with amount ${orderDto.amountOut}`
      )
    }
  }

  private async handleWaitBuy(job: AutoOrderJobDto, now: number) {
    if (!job.activeOrderId) {
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_BUY,
        now
      )
      return
    }

    const order = await this.dbService.getRetailOrderByOrderId(
      job.activeOrderId
    )

    if (!order) {
      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_BUY,
        now
      )
      return
    }

    if (order.status === OrderStatus.SETTLED) {
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.WITHDRAW_BUY,
        now
      )
      this.logger.info(
        `[Auto Order Cycle] Job ${job.jobId} BUY order ${order.orderId} settled`
      )
      return
    }

    if (order.status === OrderStatus.CANCELLED) {
      await this.dbService.updateAutoOrderJobActiveOrder(job.jobId, null, now)
      await this.updateCycleState(
        job.jobId,
        AutoOrderCycleState.CREATE_BUY,
        now
      )
      this.logger.warn(
        `[Auto Order Cycle] Job ${job.jobId} BUY order ${order.orderId} cancelled`
      )
      return
    }

    // Still waiting for order to settle
  }

  private async updateCycleState(
    jobId: string,
    newState: AutoOrderCycleState,
    now: number
  ) {
    const job = await this.dbService.getAutoOrderJobByJobId(jobId)
    if (job) {
      job.cycleState = newState
      await this.dbService.updateAutoOrderJob(job)
    }
  }

  private async updateCycleStateWithAmount(
    jobId: string,
    newState: AutoOrderCycleState,
    receivedAmount: string,
    now: number
  ) {
    const job = await this.dbService.getAutoOrderJobByJobId(jobId)
    if (job) {
      job.cycleState = newState
      job.lastReceivedAmount = receivedAmount
      await this.dbService.updateAutoOrderJob(job)
    }
  }

  private async getOrderPrice(job: AutoOrderJobDto): Promise<string | null> {
    const marketPriceStr = job.marketPrice
      ? this.normalizePrice(job.marketPrice, PRICE_DECIMALS)
      : null

    if (!marketPriceStr || Number(marketPriceStr) <= 0) {
      return null
    }

    const price = Number(marketPriceStr)
    const minPrice = Number(job.minPrice)
    const maxPrice = Number(job.maxPrice)

    if (price < minPrice || price > maxPrice) {
      return null
    }

    const orderPrice =
      job.orderType === OrderType.MARKET
        ? marketPriceStr
        : this.normalizePrice(job.price, PRICE_DECIMALS)

    if (!orderPrice || Number(orderPrice) <= 0) {
      this.logger.warn(`Invalid order price for job ${job.jobId}`)
      return null
    }

    return orderPrice
  }

  private async getAmountFromLastOrder(
    job: AutoOrderJobDto
  ): Promise<string | undefined> {
    if (!job.lastOrderId) {
      return job.amountOut
    }

    const order = await this.dbService.getRetailOrderByOrderId(
      job.lastOrderId
    )
    if (!order || !order.swapMessage) {
      return undefined
    }

    const assetPair = await this.dbService.getAssetPairById(
      job.assetPairId,
      job.chainId
    )
    if (!assetPair) {
      return undefined
    }

    const swapMessage = deserializeDarkSwapMessage(order.swapMessage)
    if (swapMessage) {
      const inDecimal = order.orderDirection === OrderDirection.SELL ? assetPair.quoteDecimal : assetPair.baseDecimal
      const outDecimal = order.orderDirection === OrderDirection.SELL ? assetPair.baseDecimal : assetPair.quoteDecimal
      if (order.status == OrderStatus.CANCELLED) {
        return ethers.formatUnits(swapMessage.orderNote.amount.toString(), outDecimal)
      } else {
        return ethers.formatUnits(swapMessage.inNote.amount.toString(), inDecimal)
      }
    }

    return undefined
  }

  private computeOrderAmounts(
    job: AutoOrderJobDto,
    baseDecimals: number,
    quoteDecimals: number,
    priceStr: string
  ): { amountOutRaw: bigint; amountInRaw: bigint } {
    const priceScaled = ethers.parseUnits(priceStr, PRICE_DECIMALS)

    if (priceScaled <= 0n) {
      throw new Error('Price must be greater than zero')
    }

    const amountOutDecimals =
      job.orderDirection === OrderDirection.SELL ? baseDecimals : quoteDecimals
    const amountInDecimals =
      job.orderDirection === OrderDirection.SELL ? quoteDecimals : baseDecimals

    const amountOutRaw = ethers.parseUnits(job.amountOut, amountOutDecimals)

    const powOut = 10n ** BigInt(amountOutDecimals)
    const powIn = 10n ** BigInt(amountInDecimals)
    const powPrice = 10n ** BigInt(PRICE_DECIMALS)

    let amountInRaw: bigint
    if (job.orderDirection === OrderDirection.SELL) {
      amountInRaw = (amountOutRaw * priceScaled * powIn) / (powOut * powPrice)
    } else {
      amountInRaw = (amountOutRaw * powIn * powPrice) / (powOut * priceScaled)
    }

    return { amountOutRaw, amountInRaw }
  }

  private normalizePrice(value: string, decimals: number): string {
    const [intPart, fracPart = ''] = value.split('.')
    if (decimals <= 0) {
      return intPart
    }
    const trimmedFraction = fracPart.slice(0, decimals)
    return trimmedFraction.length > 0
      ? `${intPart}.${trimmedFraction}`
      : intPart
  }
}

import { v4 } from 'uuid'
import { Logger } from 'tslog'
import { ethers } from 'ethers'
import { DatabaseService } from '../common/db/database.service'
import { AssetManager } from '../assetManagement'
import { OrderManager } from '../orderManagement'
import {
  AutoOrderJobDto,
  AutoOrderJobStatus,
  AutoOrderJobOrderDto,
  DepositDto,
  OrderDto,
  OrderDirection,
  OrderType,
  OrderStatus,
  SortType,
  WithdrawDto,
  OrderRetailDto
} from '../types'
import { OrderRetailManager } from '../retailOrderManagement'

const PRICE_DECIMALS = 18

export class AutoOrderManager {
  private readonly logger = new Logger({ name: AutoOrderManager.name })
  private dbService: DatabaseService
  private assetManager: AssetManager
  private orderRetailManager: OrderRetailManager
  private intervalTimer?: NodeJS.Timeout
  private isTicking = false
  private defaultIntervalSeconds = 15

  public constructor(
    dbService: DatabaseService,
    orderRetailManager: OrderRetailManager,
    assetManager: AssetManager
  ) {
    this.dbService = dbService
    this.orderRetailManager = orderRetailManager
    this.assetManager = assetManager
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
      job.orderType === OrderType.LIMIT ||
      job.orderType === OrderType.LIMIT_MAKER
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

          if (job.activeOrderId) {
            const order = await this.dbService.getOrderByOrderId(
              job.activeOrderId
            )

            if (!order) {
              await this.dbService.updateAutoOrderJobActiveOrder(
                job.jobId,
                null,
                now
              )
              continue
            }

            if (order.status === OrderStatus.SETTLED) {
              const assetPair = await this.dbService.getAssetPairById(
                order.assetPairId,
                order.chainId
              )

              if (!assetPair) {
                this.logger.warn(
                  `Asset pair not found for settled order ${order.orderId}`
                )
                continue
              }

              const inAsset =
                order.orderDirection === OrderDirection.BUY
                  ? assetPair.baseAddress
                  : assetPair.quoteAddress

              // const withdrawDto: WithdrawDto = {
              //   chainId: order.chainId,
              //   wallet: order.wallet,
              //   asset: inAsset,
              //   amount: order.amountIn
              // }

              // await this.assetManager.withdraw(withdrawDto)

              await this.dbService.updateAutoOrderJobActiveOrder(
                job.jobId,
                null,
                now
              )
              continue
            }

            if (order.status === OrderStatus.CANCELLED) {
              await this.dbService.updateAutoOrderJobActiveOrder(
                job.jobId,
                null,
                now
              )
              continue
            }

            continue
          }

          const assetPair = await this.dbService.getAssetPairById(
            job.assetPairId,
            job.chainId
          )
          if (!assetPair) {
            this.logger.warn(
              `Asset pair not found for job ${job.jobId}: ${job.assetPairId}`
            )
            continue
          }

          const marketPriceStr = job.marketPrice
            ? this.normalizePrice(job.marketPrice, PRICE_DECIMALS)
            : null
          if (!marketPriceStr || Number(marketPriceStr) <= 0) {
            continue
          }

          const price = Number(marketPriceStr)
          const minPrice = Number(job.minPrice)
          const maxPrice = Number(job.maxPrice)

          if (price < minPrice || price > maxPrice) {
            continue
          }

          const orderPrice =
            job.orderType === OrderType.MARKET
              ? marketPriceStr
              : this.normalizePrice(job.price, PRICE_DECIMALS)

          if (!orderPrice || Number(orderPrice) <= 0) {
            this.logger.warn(`Invalid order price for job ${job.jobId}`)
            continue
          }

          const { amountOutRaw, amountInRaw } = this.computeOrderAmounts(
            job,
            assetPair.baseDecimal,
            assetPair.quoteDecimal,
            orderPrice
          )

          if (amountInRaw <= 0n || amountOutRaw <= 0n) {
            continue
          }

          const outAsset =
            job.orderDirection === OrderDirection.BUY
              ? assetPair.quoteAddress
              : assetPair.baseAddress

          // const depositDto: DepositDto = {
          //   chainId: job.chainId,
          //   wallet: job.wallet,
          //   asset: outAsset,
          //   amount: amountOutRaw.toString()
          // }

          // await this.assetManager.deposit(depositDto)

          const orderDto: OrderRetailDto = {
            orderId: v4(),
            wallet: job.wallet,
            chainId: job.chainId,
            assetPairId: job.assetPairId,
            orderDirection: job.orderDirection,
            orderType: job.orderType,
            timeInForce: job.timeInForce,
            stpMode: job.stpMode,
            price: orderPrice,
            amountOut: amountOutRaw.toString(),
            amountIn: amountInRaw.toString(),
            partialAmountIn: amountInRaw.toString(), // fully filled when created
            feeRatio: job.feeRatio
          }

          if (!orderDto.orderId) {
            this.logger.error(`Failed to generate orderId for job ${job.jobId}`)
            continue
          }

          await this.orderRetailManager.createOrder(orderDto)

          const log: AutoOrderJobOrderDto = {
            jobId: job.jobId,
            orderId: orderDto.orderId,
            chainId: job.chainId,
            wallet: job.wallet
          }

          await this.dbService.addAutoOrderJobOrder(log)

          await this.dbService.updateAutoOrderJobActiveOrder(
            job.jobId,
            orderDto.orderId,
            now
          )
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

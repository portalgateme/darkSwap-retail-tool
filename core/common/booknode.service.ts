import axios from 'axios'
import { MatchedOrderDto } from '../settlement/dto/matchedOder.dto'
import { SettlementDto } from '../settlement/dto/settlement.dto'
import { bobConfirmDto } from '../settlement/dto/bobConfirm.dto'
import {
  AuthInfo,
  CancelOrderDto,
  DarkSwapConfig,
  OrderDto,
  OrderRetailDto,
  OrderType,
  UpdatePriceDto
} from '../types'
import { DarkSwapError } from '@thesingularitynetwork/darkswap-sdk'
import { BobPostSettlementDto } from '../settlement/dto/bobPostSettlement.dto'

interface BookNodeMatchedOrder {
  orderId: string
  chainId: number
  assetPairId: string
  orderDirection: number
  isAlice: boolean
  matchedPrice: number
  aliceAmount: string
  aliceMatchedAmount: string
  bobMatchedAmount: string
  alicePublicKey: string
  bobSwapMessage: string
}

interface BookNodeCreateOrderDto {
  chainId: number
  wallet: string
  orderId: string
  assetPairId: string
  orderDirection: number
  orderType: number
  timeInForce: number
  stpMode: number
  orderTriggerPrice: number
  price: number
  amountOut: string
  amountIn: string
  partialAmountIn: string
  publicKey: string
  nullifier: string
  txHashCreated: string
}

interface BookNodeCreateRetailOrderDto {
  chainId: number
  wallet: string
  assetPairId: string
  orderDirection: number
  orderType: number
  timeInForce: number
  stpMode: number
  orderTriggerPrice: number
  price: number
  amountOut: string
  amountIn: string
  nullifier: string
  txHashCreated: string
  swapMessage: string
}

interface BookNodeUpdatePriceDto {
  chainId: number
  wallet: string
  orderId: string
  price: number
  amountIn: string
  partialAmountIn: string
}

export class BooknodeService {
  private config: DarkSwapConfig

  public constructor(config: DarkSwapConfig) {
    this.config = config
  }

  private async sendPutRequest(req: any, url: string): Promise<any> {
    try {
      const result = await axios.put(
        `${this.config.bookNodeApiUrl}${url}`,
        req,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      return result
    } catch (error: any) {
      console.error(
        'Error in sendPutRequest:',
        error.response ? error.response.data : error.message
      )
      throw new DarkSwapError(
        `Failed to send request to booknode for url: ${url}`
      )
    }
  }

  private async sendRequest(
    req: any,
    url: string,
    authInfo?: AuthInfo
  ): Promise<any> {
    try {
      const result = await axios.post(
        `${this.config.bookNodeApiUrl}${url}`,
        req,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': authInfo?.wallet.toLowerCase(),
            'x-wallet-signature': authInfo?.signature,
            'x-wallet-timestamp': authInfo?.timestamp
          }
        }
      )
      return result
    } catch (error: any) {
      console.error(
        'Error in sendRequest:',
        error.response ? error.response.data : error.message
      )
      throw new DarkSwapError(
        `Failed to send request to booknode for url: ${url}`
      )
    }
  }

  public async getMatchedOrderDetails(
    order: OrderDto
  ): Promise<MatchedOrderDto> {
    const settlementDto: SettlementDto = {
      orderId: order.orderId,
      wallet: order.wallet,
      chainId: order.chainId,
      txHashSettled: order.txHashSettled ?? ''
    }

    const result = await this.sendRequest(
      settlementDto,
      '/api/orders/matchdetails'
    )
    const bookNodeMathedOrderDetail = result.data.data as BookNodeMatchedOrder
    return {
      orderId: bookNodeMathedOrderDetail.orderId,
      chainId: bookNodeMathedOrderDetail.chainId,
      assetPairId: bookNodeMathedOrderDetail.assetPairId,
      orderDirection: bookNodeMathedOrderDetail.orderDirection,
      isAlice: bookNodeMathedOrderDetail.isAlice,
      aliceAmount: BigInt(bookNodeMathedOrderDetail.aliceAmount),
      aliceMatchedAmount: BigInt(bookNodeMathedOrderDetail.bobMatchedAmount),
      bobMatchedAmount: BigInt(bookNodeMathedOrderDetail.bobMatchedAmount),
      bobSwapMessage: bookNodeMathedOrderDetail.bobSwapMessage
    } as MatchedOrderDto
  }

  public async createOrder(
    orderDto: OrderDto,
    authInfo: AuthInfo
  ): Promise<any> {
    let orderTriggerPrice = 0
    if (
      orderDto.orderType === OrderType.STOP_LOSS_LIMIT ||
      orderDto.orderType === OrderType.STOP_LOSS ||
      orderDto.orderType === OrderType.TAKE_PROFIT ||
      orderDto.orderType === OrderType.TAKE_PROFIT_LIMIT
    ) {
      orderTriggerPrice = Number(orderDto.orderTriggerPrice)
    }

    const createOrderRequestDto: BookNodeCreateOrderDto = {
      chainId: orderDto.chainId,
      wallet: orderDto.wallet,
      orderId: orderDto.orderId,
      assetPairId: orderDto.assetPairId,
      orderDirection: orderDto.orderDirection,
      orderType: orderDto.orderType,
      timeInForce: orderDto.timeInForce,
      stpMode: orderDto.stpMode,
      orderTriggerPrice: orderTriggerPrice,
      price: Number(orderDto.price),
      amountOut: orderDto.amountOut.toString(),
      amountIn: orderDto.amountIn.toString(),
      partialAmountIn: orderDto.partialAmountIn
        ? orderDto.partialAmountIn.toString()
        : '',
      publicKey: orderDto.publicKey ?? '',
      nullifier: orderDto.nullifier ? orderDto.nullifier.toString() : '',
      txHashCreated: orderDto.txHashCreated ?? ''
    }
    const result = await this.sendRequest(
      createOrderRequestDto,
      '/api/orders/create',
      authInfo
    )
    return result.data
  }

  public async createRetailOrder(
    orderDto: OrderRetailDto,
    authInfo: AuthInfo
  ): Promise<any> {
    let orderTriggerPrice = 0
    if (
      orderDto.orderType === OrderType.STOP_LOSS_LIMIT ||
      orderDto.orderType === OrderType.STOP_LOSS ||
      orderDto.orderType === OrderType.TAKE_PROFIT ||
      orderDto.orderType === OrderType.TAKE_PROFIT_LIMIT
    ) {
      orderTriggerPrice = Number(orderDto.orderTriggerPrice)
    }

    const createOrderRequestDto: BookNodeCreateRetailOrderDto = {
      chainId: orderDto.chainId,
      wallet: orderDto.wallet,
      assetPairId: orderDto.assetPairId,
      orderDirection: orderDto.orderDirection,
      orderType: orderDto.orderType,
      timeInForce: orderDto.timeInForce,
      stpMode: orderDto.stpMode,
      orderTriggerPrice: orderTriggerPrice,
      price: Number(orderDto.price),
      amountOut: orderDto.amountOut.toString(),
      amountIn: orderDto.amountIn.toString(),
      nullifier: orderDto.nullifier ? orderDto.nullifier.toString() : '',
      txHashCreated: orderDto.txHashCreated ?? '',
      swapMessage: orderDto.swapMessage ?? ''
    }
    const result = await this.sendRequest(
      createOrderRequestDto,
      '/api/orders/create',
      authInfo
    )
    return result.data
  }

  public async cancelOrder(
    cancelOrderDto: CancelOrderDto,
    authInfo: AuthInfo
  ): Promise<any> {
    const result = await this.sendRequest(
      cancelOrderDto,
      '/api/orders/cancel',
      authInfo
    )
    return result.data
  }

  public async settleOrder(order: OrderDto, txHash: string): Promise<any> {
    const settlementDto: SettlementDto = {
      orderId: order.orderId,
      wallet: order.wallet,
      chainId: order.chainId,
      txHashSettled: txHash
    }
    const result = await this.sendRequest(settlementDto, '/api/orders/settle')
    return result.data
  }

  public async confirmOrder(recipientConfirmDto: bobConfirmDto): Promise<any> {
    const result = await this.sendRequest(
      recipientConfirmDto,
      '/api/orders/confirm'
    )
    return result.data
  }

  public async updateOrderPrice(updatePriceDto: UpdatePriceDto): Promise<any> {
    const bookNodeUpdatePriceDto: BookNodeUpdatePriceDto = {
      chainId: updatePriceDto.chainId,
      wallet: updatePriceDto.wallet,
      orderId: updatePriceDto.orderId,
      price: Number(updatePriceDto.price),
      amountIn: updatePriceDto.amountIn,
      partialAmountIn: updatePriceDto.partialAmountIn
    }
    const result = await this.sendPutRequest(
      bookNodeUpdatePriceDto,
      '/api/orders/price'
    )
    return result.data
  }

  public async bobPostSettlement(
    bobPostSettlementDto: BobPostSettlementDto
  ): Promise<any> {
    const result = await this.sendRequest(
      bobPostSettlementDto,
      '/api/orders/takerSettled'
    )
    return result.data
  }
}

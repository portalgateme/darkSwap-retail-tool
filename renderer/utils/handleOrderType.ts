import { OrderType } from '../types'

export const handleOrderType = (
  orderType: OrderType,
  isUseMarketPrice: boolean
) => {
  switch (orderType) {
    case OrderType.STOP_LOSS_LIMIT:
    case OrderType.STOP_LOSS:
      return isUseMarketPrice ? OrderType.STOP_LOSS : OrderType.STOP_LOSS_LIMIT
    case OrderType.TAKE_PROFIT_LIMIT:
    case OrderType.TAKE_PROFIT:
      return isUseMarketPrice
        ? OrderType.TAKE_PROFIT
        : OrderType.TAKE_PROFIT_LIMIT

    default:
      return OrderType.STOP_LOSS_LIMIT
  }
}

import { BaseDto } from '../../types'

export interface SettlementDto extends BaseDto {
  orderId: string
  txHashSettled: string
}

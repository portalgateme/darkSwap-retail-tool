import { BaseDto } from '../../types'

export interface bobConfirmDto extends BaseDto {
  orderId: string
  swapMessage: string
}

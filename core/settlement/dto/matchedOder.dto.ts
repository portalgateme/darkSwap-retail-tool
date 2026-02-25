export interface MatchedOrderDto {
  orderId: string
  chainId: number
  assetPairId: string
  orderDirection: number
  isAlice: boolean
  aliceAmount: bigint
  aliceMatchedAmount: bigint
  bobMatchedAmount: bigint
  alicePublicKey: string
  bobPublicKey: string
  aliceSwapMessage: string
  bobSwapMessage: string
}

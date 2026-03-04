export interface Network {
  name: string
  chainId: number
  rpcUrl: string
  icon: string
  isTestnet?: boolean
}

export interface Account {
  address: string
  name: string
  balance: string
}

export interface Token {
  address: string
  symbol: string
  name?: string
  decimals: number
  logoURI?: string
}

export interface Wallet {
  id: string
  name: string
  address: string
  privateKey?: string
  type: 'privateKey' | 'fireblocks'
}

export interface AssetPairDto {
  baseAddress: string
  baseDecimal: number
  baseSymbol: string
  chainId: number
  createdAt: string
  id: string
  quoteAddress: string
  quoteDecimal: number
  quoteSymbol: string
  updatedAt: string
}

export enum OrderDirection {
  BUY = 0,
  SELL = 1
}

export enum OrderType {
  MARKET = 0,
  LIMIT = 1,
  STOP_LOSS = 2,
  STOP_LOSS_LIMIT = 3,
  TAKE_PROFIT = 4,
  TAKE_PROFIT_LIMIT = 5,
  LIMIT_MAKER = 6
}

export enum TimeInForce {
  GTC = 0,
  GTD = 1,
  IOC = 2,
  FOK = 4,
  AON_GTC = 8,
  AON_GTD = 9
}

export enum StpMode {
  NONE = 0,
  EXPIRE_MAKER = 1,
  EXPIRE_TAKER = 2,
  BOTH = 3
}

export enum OrderStatus {
  OPEN = 0,
  MATCHED = 1,
  BOB_CONFIRMED = 2,
  SETTLED = 3,
  CANCELLED = 4,
  NOT_TRIGGERED = 5,
  TRIGGERED = 6,
  WITHDRAWN = 7
}

export enum AutoOrderJobStatus {
  ACTIVE = 0,
  PAUSED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  PRE_CANCELLED = 4
}

export interface OrderEvents extends OrderDto {
  events: OrderEventDto[]
}

export interface AutoOrderJobDto {
  id?: number
  jobId: string
  chainId: number
  wallet: string
  assetPairId: string
  orderDirection: OrderDirection
  orderType: OrderType
  timeInForce: TimeInForce
  stpMode: StpMode
  price: string
  marketPrice?: string
  minPrice: string
  maxPrice: string
  amountOut: string
  feeRatio: string
  startAt: number
  endAt?: number
  intervalSeconds: number
  status?: AutoOrderJobStatus
  activeOrderId?: string | null
  lastRunAt?: number | null
  orders?: OrderEventDto[]
  maxOrdersPerDay: number
  errorMessage?: string
}

export enum SortType {
  NEWEST = 'newest',
  OLDEST = 'oldest'
}

export interface CreateAutoOrderFormData {
  price: string
  marketPrice?: string
  minPrice: string
  maxPrice: string
  amountOut: string
  feeRatio: string
  startAt: string
  endAt: string
  intervalSeconds: string
  orderDirection: OrderDirection
  orderType: OrderType
  maxOrdersPerDay: string
}

export interface EditAutoOrderFormData {
  assetPairId: string
  orderDirection: OrderDirection
  orderType: OrderType
  price: string
  marketPrice?: string
  minPrice: string
  maxPrice: string
  amountOut: string
  feeRatio: string
  startAt: string
  endAt: string
  intervalSeconds: string
}

export interface BaseDto {
  chainId: number
  wallet: string
}

export interface OrderDto extends BaseDto {
  id?: number
  orderId: string
  agentOrderId?: string
  assetPairId: string
  orderDirection: OrderDirection
  orderType: OrderType
  timeInForce: TimeInForce
  stpMode: StpMode
  orderTriggerPrice?: string
  price: string
  amountOut: string
  amountIn: string
  partialAmountIn?: string
  feeRatio: string
  status?: OrderStatus
  publicKey?: string
  noteCommitment?: string
  incomingNoteCommitment?: string
  nullifier?: string
  txHashCreated?: string
  txHashSettled?: string
}

export interface OrderEventDto extends BaseDto {
  id: number
  orderId: string
  status: number
  createdAt: Date
}

export interface AssetDto {
  asset: string
  amount: string
  lockedAmount: string
}

export interface MyAssetsDto {
  chainId: number
  assets: AssetDto[]
}

export enum PriceType {
  MARKET = 'Market Price',
  LIMIT = 'Limit Price'
}

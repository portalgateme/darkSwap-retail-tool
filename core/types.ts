import { DarkSwapNote } from '@thesingularitynetwork/darkswap-sdk'

export enum ChainId {
  HARDHAT = 31337,
  HARDHAT_ARBITRUM = 31338,
  HARDHAT_BASE = 31339,
  MAINNET = 1,
  SEPOLIA = 11155111,
  HORIZEN_TESTNET = 845320009,
  ARBITRUM_ONE = 42161,
  BASE = 8453
}

export type HexData = `0x${string}`

export type NetworkConfig = {
  priceOracle: HexData
  ethAddress: HexData
  nativeWrapper: HexData
  merkleTreeOperator: HexData
  darkSwapAssetManager: HexData
  darkSwapFeeAssetManager: HexData
  drakSwapSubgraphUrl: string
}

export enum OrderDirection {
  BUY = 0,
  SELL = 1
}

export enum NoteStatus {
  CREATED = 0,
  ACTIVE = 1,
  SPENT = 2,
  LOCKED = 3
}

export enum OrderNoteStatus {
  USED,
  VERFIED,
  INVALID,
  PENDING
}

export enum NoteType {
  DARKSWAP = 0,
  DARKSWAP_ORDER = 1,
  SINGULARITY = 2
}

export enum OrderStatus {
  OPEN = 0,
  MATCHED = 1,
  BOB_CONFIRMED = 2,
  SETTLED = 3,
  CANCELLED = 4,
  NOT_TRIGGERED = 5,
  TRIGGERED = 6
}

export enum AutoOrderJobStatus {
  ACTIVE = 0,
  PAUSED = 1,
  COMPLETED = 2,
  CANCELLED = 3
}

export enum AutoOrderCycleState {
  CREATE_SELL = 0,
  WAIT_SELL = 1,
  WITHDRAW_SELL = 2,
  CREATE_BUY = 3,
  WAIT_BUY = 4,
  WITHDRAW_BUY = 5
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

export enum StpMode {
  NONE = 0,
  EXPIRE_MAKER = 1,
  EXPIRE_TAKER = 2,
  BOTH = 3
}

export enum TimeInForce {
  GTC = 0,
  GTD = 1,
  IOC = 2,
  FOK = 4,
  AON_GTC = 8,
  AON_GTD = 9
}

export interface WalletConfig {
  name: string
  address: string
  privateKey?: string
  type: 'privateKey' | 'fireblocks'
}

export interface ChainRpcConfig {
  chainId: number
  rpcUrl: string
}

export interface ProofOptionsConfig {
  threads?: number
  memory?: number
}

export interface FireblocksConfig {
  privateKey: string
  apiKey: string
  apiBaseUrl?: string
}

export interface DarkSwapConfig {
  wallets: WalletConfig[]
  chainRpcs: ChainRpcConfig[]
  dbFilePath: string
  agentUrl: string
  proofOptions?: ProofOptionsConfig
}

export interface BaseDto {
  chainId: number
  wallet: string
}

export interface OrderDto extends BaseDto {
  id?: number
  orderId: string
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

export interface OrderRetailDto extends BaseDto {
  id?: number
  orderId?: string
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
  swapMessage?: string
}

export interface OrderEventDto extends BaseDto {
  id: number
  orderId: string
  status: number
  createdAt: Date
}

export interface CancelOrderDto extends BaseDto {
  orderId: string
}

export interface UpdatePriceDto extends BaseDto {
  orderId: string
  price: string
  amountIn: string
  partialAmountIn: string
}

export interface AutoOrderJobDto extends BaseDto {
  id?: number
  jobId: string
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
  activeOrderId?: string
  lastRunAt?: number
  cycleState?: AutoOrderCycleState
  startDirection?: OrderDirection
  lastReceivedAmount?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AutoOrderJobOrderDto extends BaseDto {
  id?: number
  jobId: string
  orderId: string
  createdAt?: Date
}

export interface AssetPairDto {
  id: string
  chainId: number
  baseAddress: string
  baseSymbol: string
  baseDecimal: number
  quoteAddress: string
  quoteSymbol: string
  quoteDecimal: number
}

export interface NoteDto extends BaseDto {
  id: number
  publicKey: string
  type: number
  note: bigint
  rho: bigint
  asset: string
  amount: bigint
  status: number
  txHashCreated: string
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

export interface SyncAssetDto extends BaseDto {
  asset: string
}

export interface DepositDto extends BaseDto {
  asset: string
  amount: string
}

export interface WithdrawDto extends BaseDto {
  asset: string
  amount: string
}

export interface WithdrawNoteDto extends BaseDto {
  note: DarkSwapNote
}

export enum SortType {
  NEWEST = 'newest',
  OLDEST = 'oldest'
}

export interface AuthInfo {
  wallet: string
  signature: string
  timestamp: string
}

import Database from 'better-sqlite3'
import config from '../../config/dbConfig'
import {
  NoteStatus,
  OrderStatus,
  NoteType,
  OrderDto,
  OrderEventDto,
  NoteDto,
  AssetPairDto,
  SortType,
  AutoOrderJobDto,
  AutoOrderJobStatus,
  AutoOrderJobOrderDto,
  OrderRetailDto,
  AutoOrderCycleState
} from '../../types'

interface NoteEntity {
  id: number
  chainId: number
  publicKey: string
  wallet: string
  type: number
  noteCommitment: string
  rho: string
  asset: string
  amount: string
  status: number
  txHashCreated: string
  createdAt: Date
  updatedAt: Date
}

interface AutoOrderJobEntity {
  id: number
  jobId: string
  chainId: number
  wallet: string
  assetPairId: string
  orderDirection: number
  orderType: number
  timeInForce: number
  stpMode: number
  price: string
  marketPrice: string
  minPrice: string
  maxPrice: string
  amountOut: string
  feeRatio: string
  startAt: number
  endAt?: number
  intervalSeconds: number
  status: number
  cycleState: number
  startDirection: number
  lastReceivedAmount?: string
  lastOrderId?: string
  errorMessage?: string
  activeOrderId?: string
  lastRunAt?: number
  createdAt: Date
  updatedAt: Date
  orders?: AutoOrderJobOrderEntity[]
  maxOrdersPerDay: number
}

interface AutoOrderJobOrderEntity {
  id: number
  jobId: string
  orderId: string
  chainId: number
  wallet: string
  createdAt: Date
}

export class DatabaseService {
  private db: Database.Database

  public constructor(db: Database.Database) {
    this.db = db
    this.init()
  }

  private async init() {
    for (const table of config.tables) {
      this.db.exec(table)
    }

    try {
      this.db.exec('ALTER TABLE AUTO_ORDER_JOBS ADD COLUMN lastOrderId TEXT')
    } catch (e) {
      // ignore
    }

    try {
      this.db.exec('ALTER TABLE AUTO_ORDER_JOBS ADD COLUMN errorMessage TEXT')
    } catch (e) {
      // ignore
    }
  }

  // Note operations
  public addNote(
    chainId: number,
    publicKey: string,
    walletAddress: string,
    type: number,
    noteCommitment: bigint,
    rho: bigint,
    asset: string,
    amount: bigint,
    txHashCreated: string
  ): number {
    const query = `INSERT INTO NOTES (
      chainId, publicKey, wallet, type, noteCommitment, 
      rho, asset, amount, status, txHashCreated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const stmt = this.db.prepare(query)
    const result = stmt.run(
      chainId,
      publicKey,
      walletAddress.toLowerCase(),
      type,
      noteCommitment.toString(),
      rho.toString(),
      asset.toLowerCase(),
      amount.toString(),
      NoteStatus.CREATED,
      txHashCreated
    )
    return Number(result.lastInsertRowid)
  }

  public getAssetNotesByWalletAndChainIdAndAsset(
    walletAddress: string,
    chainId: number,
    asset: string
  ): NoteDto[] {
    const query = `SELECT * FROM NOTES WHERE wallet = ? AND chainId = ? AND asset = ? AND status = ? AND type = ?`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      walletAddress.toLowerCase(),
      chainId,
      asset.toLowerCase(),
      NoteStatus.ACTIVE,
      NoteType.DARKSWAP
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset.toLowerCase(),
      amount: BigInt(row.amount),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getNotesByWalletAndChainIdAndAsset(
    walletAddress: string,
    chainId: number,
    asset: string
  ): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE wallet = ? AND chainId = ? AND asset = ? AND (status = ? OR status = ?)`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      walletAddress.toLowerCase(),
      chainId,
      asset.toLowerCase(),
      NoteStatus.ACTIVE,
      NoteStatus.CREATED
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset.toLowerCase(),
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getAssetsNotesByWalletAndChainId(
    walletAddress: string,
    chainId: number
  ): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE wallet = ? AND chainId = ? AND (status = ? OR status = ?) AND type = ?`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      walletAddress.toLowerCase(),
      chainId,
      NoteStatus.ACTIVE,
      NoteStatus.LOCKED,
      NoteType.DARKSWAP
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset.toLowerCase(),
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getNotesByWalletAndChainId(
    walletAddress: string,
    chainId: number
  ): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE wallet = ? AND chainId = ? AND (status = ? OR status = ? OR status = ?)`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      walletAddress.toLowerCase(),
      chainId,
      NoteStatus.ACTIVE,
      NoteStatus.CREATED
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset.toLowerCase(),
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getNotesByWallet(walletAddress: string): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE wallet = ? AND (status = ? OR status = ?)`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      walletAddress.toLowerCase(),
      NoteStatus.ACTIVE,
      NoteStatus.LOCKED
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset.toLowerCase(),
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getNotesByAsset(
    asset: string,
    chainId: number
  ): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE asset = ? AND chainId = ? AND status = ? ORDER BY amount DESC`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      asset.toLowerCase(),
      chainId,
      NoteStatus.ACTIVE
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset,
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public async getNoteByCommitment(noteCommitment: string): Promise<NoteDto> {
    const query = `SELECT * FROM NOTES WHERE noteCommitment = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(noteCommitment) as NoteEntity
    const note = {
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset,
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }
    return note
  }

  public async getNoteByOrderId(orderId: string): Promise<NoteDto> {
    const query = `SELECT * FROM NOTES WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(orderId) as NoteEntity
    const note = {
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset,
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }
    return note
  }

  public async getNoteByAssetAndAmount(
    asset: string,
    amount: bigint,
    chainId: number
  ): Promise<NoteDto[]> {
    const query = `SELECT * FROM NOTES WHERE asset = ? AND amount =? chainId = ? AND status = ? ORDER BY amount DESC`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      asset,
      amount.toString(),
      chainId,
      NoteStatus.ACTIVE
    ) as NoteEntity[]

    const notes = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      publicKey: row.publicKey,
      wallet: row.wallet,
      type: row.type,
      note: BigInt(row.noteCommitment),
      rho: BigInt(row.rho),
      asset: row.asset,
      amount: BigInt(row.amount.toString()),
      status: row.status,
      txHashCreated: row.txHashCreated
    }))

    return notes
  }

  public updateNoteTransactionAndStatus(id: number, txHash: string) {
    const query = `UPDATE NOTES SET txHashCreated = ?, status = ? WHERE id = ?`
    const stmt = this.db.prepare(query)
    stmt.run(txHash, NoteStatus.ACTIVE, id)
  }

  private async updateNoteStatus(
    wallet: string,
    chainId: number,
    noteCommitment: bigint,
    status: number
  ) {
    const query = `UPDATE NOTES SET status = ? WHERE wallet = ? AND chainId = ? AND noteCommitment = ?`
    const stmt = this.db.prepare(query)
    stmt.run(status, wallet.toLowerCase(), chainId, noteCommitment.toString())
  }

  public async updateNoteTransactionByWalletAndNoteCommitment(
    wallet: string,
    chainId: number,
    noteCommitment: bigint,
    txHash: string
  ) {
    const query = `UPDATE NOTES SET txHashCreated = ?, status = ? WHERE wallet = ? AND chainId = ? AND noteCommitment = ? AND status = ?`
    const stmt = this.db.prepare(query)
    stmt.run(
      txHash,
      NoteStatus.ACTIVE,
      wallet.toLowerCase(),
      chainId,
      noteCommitment.toString(),
      NoteStatus.CREATED
    )
  }

  public async updateNoteCreatedByWalletAndNoteCommitment(
    wallet: string,
    chainId: number,
    noteCommitment: bigint
  ) {
    const query = `UPDATE NOTES SET status = ? WHERE wallet = ? AND chainId = ? AND noteCommitment = ?`
    const stmt = this.db.prepare(query)
    stmt.run(
      NoteStatus.CREATED,
      wallet.toLowerCase(),
      chainId,
      noteCommitment.toString()
    )
  }

  public async updateNoteActiveByWalletAndNoteCommitment(
    wallet: string,
    chainId: number,
    noteCommitment: bigint
  ) {
    const query = `UPDATE NOTES SET status = ? WHERE wallet = ? AND chainId = ? AND noteCommitment = ?`
    const stmt = this.db.prepare(query)
    stmt.run(
      NoteStatus.ACTIVE,
      wallet.toLowerCase(),
      chainId,
      noteCommitment.toString()
    )
  }

  public updateNoteSpentByWalletAndNoteCommitment(
    wallet: string,
    chainId: number,
    noteCommitment: bigint
  ) {
    this.updateNoteStatus(wallet, chainId, noteCommitment, NoteStatus.SPENT)
  }

  public updateNoteLockedByWalletAndNoteCommitment(
    wallet: string,
    chainId: number,
    noteCommitment: bigint
  ) {
    this.updateNoteStatus(wallet, chainId, noteCommitment, NoteStatus.LOCKED)
  }

  // Asset pair operations
  public async addAssetPair(assetPair: AssetPairDto) {
    const query = `INSERT INTO ASSET_PAIRS ( id, chainId, baseAddress, baseSymbol, baseDecimal, quoteAddress, quoteSymbol, quoteDecimal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    const stmt = this.db.prepare(query)
    stmt.run(
      assetPair.id,
      assetPair.chainId,
      assetPair.baseAddress,
      assetPair.baseSymbol,
      assetPair.baseDecimal,
      assetPair.quoteAddress,
      assetPair.quoteSymbol,
      assetPair.quoteDecimal
    )
  }

  public async getAssetPairs(chainId: number): Promise<AssetPairDto[]> {
    const query = `SELECT * FROM ASSET_PAIRS WHERE chainId = ?`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(chainId) as AssetPairDto[]

    const assetPairs = rows.map((row) => ({
      id: row.id,
      chainId: row.chainId,
      baseAddress: row.baseAddress,
      baseSymbol: row.baseSymbol,
      baseDecimal: row.baseDecimal,
      quoteAddress: row.quoteAddress,
      quoteSymbol: row.quoteSymbol,
      quoteDecimal: row.quoteDecimal
    }))

    return assetPairs
  }

  public async getAssetPairById(
    assetPairId: string,
    chainId: number
  ): Promise<AssetPairDto | null> {
    const query = `SELECT * FROM ASSET_PAIRS WHERE id = ? AND chainId = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(assetPairId, chainId) as AssetPairDto | undefined

    if (!row) {
      return null
    }

    const assetPair: AssetPairDto = {
      id: row.id,
      chainId: row.chainId,
      baseAddress: row.baseAddress,
      baseSymbol: row.baseSymbol,
      baseDecimal: row.baseDecimal,
      quoteAddress: row.quoteAddress,
      quoteSymbol: row.quoteSymbol,
      quoteDecimal: row.quoteDecimal
    }

    return assetPair
  }

  // Order operations
  public async addOrderByDto(order: OrderDto) {
    const query = `INSERT INTO ORDERS (
      orderId, chainId, assetPairId, orderDirection, orderType, 
      timeInForce, stpMode, price, amountOut, amountIn, 
      partialAmountIn, feeRatio, status, wallet, publicKey, noteCommitment, 
      nullifier, txHashCreated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const stmt = this.db.prepare(query)
    stmt.run(
      order.orderId,
      order.chainId,
      order.assetPairId,
      order.orderDirection,
      order.orderType,
      order.timeInForce,
      order.stpMode,
      order.price,
      order.amountOut,
      order.amountIn,
      order.partialAmountIn,
      order.feeRatio,
      order.status,
      order.wallet,
      order.publicKey,
      order.noteCommitment ? order.noteCommitment.toString() : '',
      order.nullifier,
      order.txHashCreated
    )
  }

  public async addRetailOrderByDto(order: OrderRetailDto) {
    const query = `INSERT INTO ORDERS (
      orderId, chainId, assetPairId, orderDirection, orderType, 
      timeInForce, stpMode, price, amountOut, amountIn, 
      partialAmountIn, feeRatio, status, wallet, publicKey, noteCommitment, 
      nullifier, txHashCreated, swapMessage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const stmt = this.db.prepare(query)
    const result = stmt.run(
      order.orderId,
      order.chainId,
      order.assetPairId,
      order.orderDirection,
      order.orderType,
      order.timeInForce,
      order.stpMode,
      order.price,
      order.amountOut,
      order.amountIn,
      order.partialAmountIn,
      order.feeRatio,
      order.status,
      order.wallet,
      order.publicKey,
      order.noteCommitment ? order.noteCommitment.toString() : '',
      order.nullifier,
      order.txHashCreated,
      order.swapMessage
    )
    return Number(result.lastInsertRowid)
  }

  public async updateTxCreatedRetailOrderById(
    orderId: string,
    txHashCreated: string
  ) {
    const query = `UPDATE ORDERS SET txHashCreated = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(txHashCreated, orderId)
  }

  public async updateAgentOrderIdOfRetailOrderById(
    orderId: string,
    agentOrderId: string
  ) {
    const query = `UPDATE ORDERS SET agentOrderId = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(agentOrderId, orderId)
  }

  public async updateTxCreatedRetailOrderByDto(
    id: number,
    txHashCreated: string
  ) {
    const query = `UPDATE ORDERS SET txHashCreated = ? WHERE id = ?`
    const stmt = this.db.prepare(query)
    stmt.run(txHashCreated, id)
  }

  public async getOrdersByStatusAndPage(
    status: number,
    page: number,
    limit: number
  ): Promise<OrderDto[]> {
    const offset = (page - 1) * limit
    const query = `SELECT * FROM ORDERS WHERE status = ? LIMIT ? OFFSET ?`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(status, limit, offset) as OrderDto[]
    const orders = rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      chainId: row.chainId,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      amountOut: row.amountOut,
      amountIn: row.amountIn,
      partialAmountIn: row.partialAmountIn,
      feeRatio: row.feeRatio,
      wallet: row.wallet,
      status: row.status,
      publicKey: row.publicKey,
      noteCommitment: row.noteCommitment,
      nullifier: row.nullifier,
      txHashCreated: row.txHashCreated,
      txHashSettled: row.txHashSettled
    }))

    return orders
  }

  public async updateOrderPrice(
    orderId: string,
    price: string,
    amountIn: bigint,
    partialAmountIn: bigint
  ) {
    const query = `UPDATE ORDERS SET price = ?, amountIn = ?, partialAmountIn = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(price, amountIn.toString(), partialAmountIn.toString(), orderId)
  }

  public async getOrderByOrderId(orderId: string): Promise<OrderDto | null> {
    const query = `SELECT * FROM ORDERS WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(orderId) as OrderDto
    if (!row) {
      return null
    }

    const order = {
      id: row.id,
      orderId: row.orderId,
      chainId: row.chainId,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      amountOut: row.amountOut,
      amountIn: row.amountIn,
      partialAmountIn: row.partialAmountIn,
      feeRatio: row.feeRatio,
      wallet: row.wallet,
      status: row.status,
      publicKey: row.publicKey,
      noteCommitment: row.noteCommitment,
      incomingNoteCommitment: row.incomingNoteCommitment,
      nullifier: row.nullifier,
      txHashCreated: row.txHashCreated,
      txHashSettled: row.txHashSettled
    }
    return order
  }

  public async getRetailOrderByOrderId(
    orderId: string
  ): Promise<OrderRetailDto | null> {
    const query = `SELECT * FROM ORDERS WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(orderId) as OrderRetailDto
    if (!row) {
      return null
    }

    const order = {
      id: row.id,
      orderId: row.orderId,
      chainId: row.chainId,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      amountOut: row.amountOut,
      amountIn: row.amountIn,
      partialAmountIn: row.partialAmountIn,
      feeRatio: row.feeRatio,
      wallet: row.wallet,
      status: row.status,
      publicKey: row.publicKey,
      noteCommitment: row.noteCommitment,
      incomingNoteCommitment: row.incomingNoteCommitment,
      nullifier: row.nullifier,
      txHashCreated: row.txHashCreated,
      txHashSettled: row.txHashSettled,
      swapMessage: row.swapMessage
    }
    return order
  }

  public async cancelOrder(orderId: string) {
    const query = `UPDATE ORDERS SET status = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(OrderStatus.CANCELLED, orderId)
  }

  public updateOrderIncomingNoteCommitment(
    orderId: string,
    incomingNoteCommitment: bigint
  ) {
    const query = `UPDATE ORDERS SET incomingNoteCommitment = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(incomingNoteCommitment.toString(), orderId)
  }

  public updateOrderConfirmedAndIncomingNoteCommitment(
    orderId: string,
    incomingNoteCommitment: bigint
  ) {
    const query = `UPDATE ORDERS SET status = ?, incomingNoteCommitment = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(
      OrderStatus.BOB_CONFIRMED,
      incomingNoteCommitment.toString(),
      orderId
    )
  }

  public updateOrderTriggered(orderId: string) {
    const query = `UPDATE ORDERS SET status = ? WHERE orderId = ? AND status = ?`
    const stmt = this.db.prepare(query)
    stmt.run(OrderStatus.OPEN, orderId, OrderStatus.NOT_TRIGGERED)
  }

  public async updateOrderMatched(orderId: string) {
    const query = `UPDATE ORDERS SET status = ? WHERE orderId = ? AND status = ?`
    const stmt = this.db.prepare(query)
    await stmt.run(OrderStatus.MATCHED, orderId, OrderStatus.OPEN)
  }

  public async updateOrderSettlementTransaction(
    orderId: string,
    txHash: string
  ) {
    const query = `UPDATE ORDERS SET txHashSettled = ?, status = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(txHash, OrderStatus.SETTLED, orderId)
  }

  public async addOrderEvent(
    chainId: number,
    orderId: string,
    wallet: string,
    status: number
  ): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO ORDER_EVENTS (orderId, wallet, chainId, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `)

    const result = stmt.run(orderId, wallet.toLowerCase(), chainId, status)

    return result.lastInsertRowid as number
  }

  public async getOrderEventsByOrderId(
    orderId: string
  ): Promise<OrderEventDto[]> {
    const stmt = this.db.prepare(`
      SELECT id, createdAt, orderId, wallet, chainId, status
      FROM ORDER_EVENTS
      WHERE orderId = ?
      ORDER BY createdAt DESC
    `)

    const rows = stmt.all(orderId) as any[]

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      orderId: row.orderId,
      wallet: row.wallet,
      chainId: row.chainId,
      status: row.status
    }))
  }

  public async getIncrementalOrderEvents(
    lastEventId: number
  ): Promise<OrderEventDto[]> {
    const stmt = this.db.prepare(`
      SELECT id, createdAt, orderId, wallet, chainId, status
      FROM ORDER_EVENTS
      WHERE id > ?
      ORDER BY id
    `)

    const rows = stmt.all(lastEventId) as any[]

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      orderId: row.orderId,
      wallet: row.wallet,
      chainId: row.chainId,
      status: row.status
    }))
  }

  public async getOrdersByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orders: OrderDto[]; total: number }> {
    const offset = (page - 1) * limit
    const params: any[] = [chainId]
    let query = `SELECT * FROM ORDERS WHERE chainId = ?`
    let countQuery = `SELECT COUNT(*) as total FROM ORDERS WHERE chainId = ?`

    if (status !== undefined) {
      query += ` AND status = ?`
      countQuery += ` AND status = ?`
      params.push(status)
    }

    if (search) {
      query += ` AND (orderId LIKE ? OR wallet LIKE ?)`
      countQuery += ` AND (orderId LIKE ? OR wallet LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    // Get total count
    const countStmt = this.db.prepare(countQuery)
    const countResult = countStmt.get(...params) as { total: number }
    const total = countResult.total

    if (sort === SortType.NEWEST) {
      query += ` ORDER BY createdAt DESC`
    } else {
      query += ` ORDER BY createdAt ASC`
    }

    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as OrderDto[]
    const orders = rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      chainId: row.chainId,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      amountOut: row.amountOut,
      amountIn: row.amountIn,
      partialAmountIn: row.partialAmountIn,
      feeRatio: row.feeRatio,
      wallet: row.wallet,
      status: row.status,
      publicKey: row.publicKey,
      noteCommitment: row.noteCommitment,
      nullifier: row.nullifier,
      txHashCreated: row.txHashCreated,
      txHashSettled: row.txHashSettled
    }))

    return { orders, total }
  }

  public async getOrderEventsByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ): Promise<{ orderEvents: OrderEventDto[]; total: number }> {
    const offset = (page - 1) * limit
    const params: any[] = [chainId]
    let query = `SELECT * FROM ORDER_EVENTS WHERE chainId = ?`
    let countQuery = `SELECT COUNT(*) as total FROM ORDER_EVENTS WHERE chainId = ?`

    if (status !== undefined) {
      query += ` AND status = ?`
      countQuery += ` AND status = ?`
      params.push(status)
    }

    if (search) {
      query += ` AND (orderId LIKE ? OR wallet LIKE ?)`
      countQuery += ` AND (orderId LIKE ? OR wallet LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    // Get total count
    const countStmt = this.db.prepare(countQuery)
    const countResult = countStmt.get(...params) as { total: number }
    const total = countResult.total

    if (sort === SortType.NEWEST) {
      query += ` ORDER BY createdAt DESC`
    } else {
      query += ` ORDER BY createdAt ASC`
    }

    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as OrderEventDto[]
    const orderEvents = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      orderId: row.orderId,
      wallet: row.wallet,
      chainId: row.chainId,
      status: row.status
    }))

    return { orderEvents, total }
  }

  // Auto order job operations
  public async addAutoOrderJob(job: AutoOrderJobDto) {
    const query = `INSERT INTO AUTO_ORDER_JOBS (
      jobId, chainId, wallet, assetPairId, orderDirection, orderType,
      timeInForce, stpMode, price, marketPrice, minPrice, maxPrice, amountOut, feeRatio,
      startAt, endAt, intervalSeconds, status, activeOrderId, lastRunAt, cycleState, startDirection, lastReceivedAmount, lastOrderId, errorMessage, maxOrdersPerDay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const stmt = this.db.prepare(query)
    stmt.run(
      job.jobId,
      job.chainId,
      job.wallet.toLowerCase(),
      job.assetPairId,
      job.orderDirection,
      job.orderType,
      job.timeInForce,
      job.stpMode,
      job.price,
      job.marketPrice ?? '0',
      job.minPrice,
      job.maxPrice,
      job.amountOut,
      job.feeRatio,
      job.startAt,
      job.endAt ?? null,
      job.intervalSeconds,
      job.status ?? AutoOrderJobStatus.ACTIVE,
      job.activeOrderId ?? null,
      job.lastRunAt ?? null,
      job.cycleState ?? AutoOrderCycleState.CREATE_SELL,
      job.startDirection ?? job.orderDirection,
      job.lastReceivedAmount ?? '0',
      job.lastOrderId ?? null,
      job.errorMessage ?? null,
      job.maxOrdersPerDay
    )
  }

  public async getAutoOrderJobByJobId(
    jobId: string
  ): Promise<AutoOrderJobDto | null> {
    const query = `SELECT * FROM AUTO_ORDER_JOBS WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    const row = stmt.get(jobId) as AutoOrderJobEntity | undefined
    if (!row) {
      return null
    }

    return {
      id: row.id,
      jobId: row.jobId,
      chainId: row.chainId,
      wallet: row.wallet,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      marketPrice: row.marketPrice,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      amountOut: row.amountOut,
      feeRatio: row.feeRatio,
      startAt: row.startAt,
      endAt: row.endAt,
      intervalSeconds: row.intervalSeconds,
      status: row.status,
      cycleState: row.cycleState,
      activeOrderId: row.activeOrderId,
      lastRunAt: row.lastRunAt,
      startDirection: row.startDirection,
      lastReceivedAmount: row.lastReceivedAmount,
      lastOrderId: row.lastOrderId,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      maxOrdersPerDay: row.maxOrdersPerDay
    }
  }

  public async getAutoOrderJobsByStatus(
    statuses: AutoOrderJobStatus[]
  ): Promise<AutoOrderJobDto[]> {
    const query = `SELECT * FROM AUTO_ORDER_JOBS WHERE status IN (${statuses.map(() => '?').join(',')})`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(...statuses) as AutoOrderJobEntity[]

    return rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      chainId: row.chainId,
      wallet: row.wallet,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      marketPrice: row.marketPrice,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      amountOut: row.amountOut,
      feeRatio: row.feeRatio,
      startAt: row.startAt,
      endAt: row.endAt,
      intervalSeconds: row.intervalSeconds,
      status: row.status,
      cycleState: row.cycleState,
      activeOrderId: row.activeOrderId,
      lastRunAt: row.lastRunAt,
      startDirection: row.startDirection,
      lastReceivedAmount: row.lastReceivedAmount,
      lastOrderId: row.lastOrderId,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      maxOrdersPerDay: row.maxOrdersPerDay
    }))
  }

  public async updateAutoOrderJobStatus(
    jobId: string,
    status: AutoOrderJobStatus
  ) {
    const query = `UPDATE AUTO_ORDER_JOBS SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(status, jobId)
  }

  public async updateAutoOrderJobActiveOrder(
    jobId: string,
    activeOrderId: string | null,
    lastRunAt: number | null
  ) {
    const query = `UPDATE AUTO_ORDER_JOBS SET activeOrderId = ?, lastRunAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(activeOrderId, lastRunAt ?? null, jobId)
  }

  public async updateAutoOrderJobLastOrder(jobId: string, lastOrderId: string) {
    const query = `UPDATE AUTO_ORDER_JOBS SET lastOrderId = ?, updatedAt = CURRENT_TIMESTAMP WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(lastOrderId, jobId)
  }

  public async updateAutoOrderJobLastRun(jobId: string, lastRunAt: number) {
    const query = `UPDATE AUTO_ORDER_JOBS SET lastRunAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(lastRunAt, jobId)
  }

  public async updateAutoOrderJobErrorMessage(
    jobId: string,
    errorMessage: string | null
  ) {
    const query = `UPDATE AUTO_ORDER_JOBS SET errorMessage = ?, updatedAt = CURRENT_TIMESTAMP WHERE jobId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(errorMessage, jobId)
  }

  public async updateAutoOrderJobsMarketPrice(
    chainId: number,
    assetPairId: string,
    marketPrice: string
  ) {
    const query = `UPDATE AUTO_ORDER_JOBS SET marketPrice = ?, updatedAt = CURRENT_TIMESTAMP WHERE chainId = ? AND assetPairId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(marketPrice, chainId, assetPairId)
  }

  public async updateAutoOrderJob(job: AutoOrderJobDto) {
    const query = `UPDATE AUTO_ORDER_JOBS SET
      assetPairId = ?,
      orderDirection = ?,
      orderType = ?,
      timeInForce = ?,
      stpMode = ?,
      price = ?,
      marketPrice = ?,
      minPrice = ?,
      maxPrice = ?,
      amountOut = ?,
      feeRatio = ?,
      startAt = ?,
      endAt = ?,
      intervalSeconds = ?,
      cycleState = ?,
      startDirection = ?,
      lastReceivedAmount = ?,
      lastOrderId = ?,
      updatedAt = CURRENT_TIMESTAMP
      WHERE jobId = ?`

    const stmt = this.db.prepare(query)
    stmt.run(
      job.assetPairId,
      job.orderDirection,
      job.orderType,
      job.timeInForce,
      job.stpMode,
      job.price,
      job.marketPrice ?? '0',
      job.minPrice,
      job.maxPrice,
      job.amountOut,
      job.feeRatio,
      job.startAt,
      job.endAt ?? null,
      job.intervalSeconds,
      job.cycleState,
      job.startDirection ?? job.orderDirection,
      job.lastReceivedAmount ?? '0',
      job.lastOrderId ?? null,
      job.jobId
    )
  }

  public async getAutoOrderJobsByPage(
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string,
    includeOrders = false
  ): Promise<{ jobs: AutoOrderJobDto[]; total: number }> {
    const offset = (page - 1) * limit
    const params: any[] = [chainId]
    let query = `SELECT * FROM AUTO_ORDER_JOBS WHERE chainId = ?`
    let countQuery = `SELECT COUNT(*) as total FROM AUTO_ORDER_JOBS WHERE chainId = ?`

    if (status !== undefined) {
      query += ` AND status = ?`
      countQuery += ` AND status = ?`
      params.push(status)
    }

    if (search) {
      query += ` AND (jobId LIKE ? OR wallet LIKE ?)`
      countQuery += ` AND (jobId LIKE ? OR wallet LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    const countStmt = this.db.prepare(countQuery)
    const countResult = countStmt.get(...params) as { total: number }
    const total = countResult.total

    if (sort === SortType.NEWEST) {
      query += ` ORDER BY createdAt DESC`
    } else {
      query += ` ORDER BY createdAt ASC`
    }

    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as AutoOrderJobEntity[]

    if (includeOrders) {
      for (const row of rows) {
        if (row.jobId) {
          const orders = await this.getAutoOrderJobOrdersByJobId(row.jobId)
          ;(row as any).orders = orders
        }
      }
    }

    const jobs = rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      chainId: row.chainId,
      wallet: row.wallet,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      marketPrice: row.marketPrice,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      amountOut: row.amountOut,
      feeRatio: row.feeRatio,
      startAt: row.startAt,
      endAt: row.endAt,
      intervalSeconds: row.intervalSeconds,
      status: row.status,
      cycleState: row.cycleState,
      activeOrderId: row.activeOrderId,
      lastRunAt: row.lastRunAt,
      startDirection: row.startDirection,
      lastReceivedAmount: row.lastReceivedAmount,
      lastOrderId: row.lastOrderId,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      orders: row.orders,
      maxOrdersPerDay: row.maxOrdersPerDay
    }))

    return { jobs, total }
  }

  // Auto order job order logs
  public async addAutoOrderJobOrder(log: AutoOrderJobOrderDto) {
    const query = `INSERT INTO AUTO_ORDER_JOB_ORDERS (
      jobId, orderId, chainId, wallet
    ) VALUES (?, ?, ?, ?)
    ON CONFLICT DO NOTHING`

    const stmt = this.db.prepare(query)
    stmt.run(log.jobId, log.orderId, log.chainId, log.wallet.toLowerCase())
  }

  public async getAutoOrderJobOrdersByJobId(
    jobId: string
  ): Promise<AutoOrderJobOrderDto[]> {
    const query = `SELECT * FROM AUTO_ORDER_JOB_ORDERS WHERE jobId = ? ORDER BY createdAt DESC`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(jobId) as AutoOrderJobOrderEntity[]

    return rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      orderId: row.orderId,
      chainId: row.chainId,
      wallet: row.wallet,
      createdAt: row.createdAt
    }))
  }

  public async getRetailActiveOrders(): Promise<OrderRetailDto[]> {
    const query = `SELECT * FROM ORDERS WHERE status IN (?, ?) ORDER BY createdAt DESC`
    const stmt = this.db.prepare(query)
    const rows = stmt.all(
      OrderStatus.NOT_TRIGGERED,
      OrderStatus.OPEN
    ) as OrderRetailDto[]

    return rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      agentOrderId: row.agentOrderId,
      chainId: row.chainId,
      assetPairId: row.assetPairId,
      orderDirection: row.orderDirection,
      orderType: row.orderType,
      timeInForce: row.timeInForce,
      stpMode: row.stpMode,
      price: row.price,
      amountOut: row.amountOut,
      amountIn: row.amountIn,
      partialAmountIn: row.partialAmountIn,
      feeRatio: row.feeRatio,
      wallet: row.wallet,
      status: row.status,
      publicKey: row.publicKey,
      noteCommitment: row.noteCommitment,
      nullifier: row.nullifier,
      txHashCreated: row.txHashCreated,
      swapMessage: row.swapMessage
    }))
  }

  public async updateRetailOrderStatus(orderId: string, status: number) {
    const query = `UPDATE ORDERS SET status = ? WHERE orderId = ?`
    const stmt = this.db.prepare(query)
    stmt.run(status, orderId)
  }
}

import { Database } from 'better-sqlite3'
import { AssetManager } from './assetManagement'
import { DatabaseService } from './common/db/database.service'
import { OrderManager } from './orderManagement'
import { DarkSwapConfig } from './types'

import { NoteService } from './common/note.service'
import { NotesJoinService } from './common/notesJoin.service'
import { SettlementService } from './settlement/settlement.service'
import { BooknodeService } from './common/booknode.service'
import { OrderEventService } from './orders/orderEvent.service'
import { SubgraphService } from './common/subgraph.service'
import { AssetPairService } from './common/assetPair.service'
import { WalletMutexService } from './common/mutex/walletMutex.service'
import { OrderService } from './orders/order.service'
import { AccountService } from './account/account.service'
import { BasicService } from './basic/basic.service'
import { RpcManager } from './common/rpcManager'
import { AutoOrderManager } from './autoOrder/autoOrder.manager'
import { OrderRetailManager } from './retailOrderManagement'
import { OrderRetailService } from './orders/orderRetail.service'

export class DarkSwapClientCore {
  private assetManager!: AssetManager
  private orderManager!: OrderManager
  private autoOrderManager!: AutoOrderManager
  private rpcManager!: RpcManager
  private assetPairService!: AssetPairService
  private orderRetailManager!: OrderRetailManager

  public constructor(config: DarkSwapConfig, db: Database) {
    this.init(db, config)
  }

  private init(db: Database, config: DarkSwapConfig) {
    this.rpcManager = new RpcManager(config)
    const dbService = new DatabaseService(db)
    const noteService = new NoteService(dbService, this.rpcManager)
    const noteJoinService = new NotesJoinService(dbService, noteService)
    const bookNodeService = new BooknodeService(config)
    const orderEventService = new OrderEventService(dbService)
    const subgraphService = SubgraphService.getInstance()
    const settlementService = new SettlementService(
      dbService,
      bookNodeService,
      noteService,
      noteJoinService,
      orderEventService,
      subgraphService,
      this.rpcManager
    )
    this.assetPairService = new AssetPairService(config, dbService)
    const walletMutexService = WalletMutexService.getInstance()
    const orderService = new OrderService(
      dbService,
      noteService,
      noteJoinService,
      bookNodeService,
      orderEventService,
      this.rpcManager
    )
    const accountService = new AccountService(config, dbService)
    const basicService = new BasicService(
      dbService,
      noteService,
      noteJoinService
    )
    const orderRetailService = new OrderRetailService(
      dbService,
      orderEventService,
      this.rpcManager,
      noteService
    )
    this.orderRetailManager = new OrderRetailManager(
      orderRetailService,
      orderEventService,
      this.rpcManager
    )

    this.assetManager = new AssetManager(
      accountService,
      basicService,
      this.rpcManager
    )
    this.orderManager = new OrderManager(
      orderService,
      orderEventService,
      this.rpcManager
    )
    this.autoOrderManager = new AutoOrderManager(
      dbService,
      this.orderRetailManager,
      this.assetManager
    )
  }

  public getAssetManager(): AssetManager {
    return this.assetManager
  }

  public getRpcManager(): RpcManager {
    return this.rpcManager
  }

  public getOrderManager(): OrderManager {
    return this.orderManager
  }

  public getAutoOrderManager(): AutoOrderManager {
    return this.autoOrderManager
  }

  public getAssetPairService(): AssetPairService {
    return this.assetPairService
  }

  public getRetailOrderManager(): OrderRetailManager {
    return this.orderRetailManager
  }
}

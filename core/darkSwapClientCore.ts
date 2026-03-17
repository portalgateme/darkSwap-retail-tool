import { Database } from 'better-sqlite3'
import { AssetManager } from './assetManagement'
import { DatabaseService } from './common/db/database.service'
import { OrderManager } from './orderManagement'
import { DarkSwapConfig } from './types'

import { NoteService } from './common/note.service'
import { OrderEventService } from './orders/orderEvent.service'
import { SubgraphService } from './common/subgraph.service'
import { AssetPairService } from './common/assetPair.service'
import { WalletMutexService } from './common/mutex/walletMutex.service'
import { OrderService } from './orders/order.service'
import { AccountService } from './account/account.service'
import { RpcManager } from './common/rpcManager'
import { AutoOrderManager } from './autoOrder/autoOrder.manager'
import { OrderRetailManager } from './retailOrderManagement'
import { OrderRetailService } from './orders/orderRetail.service'
import { AgentService } from './common/agent.service'

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
    const orderEventService = new OrderEventService(dbService)
    const subgraphService = SubgraphService.getInstance()
    const agentService = new AgentService(config)

    this.assetPairService = new AssetPairService(dbService, agentService)
    const walletMutexService = WalletMutexService.getInstance()
    const orderService = new OrderService(
      dbService,
      noteService,
      orderEventService,
      this.rpcManager
    )
    const accountService = new AccountService(config, dbService)

    this.assetManager = new AssetManager(
      accountService,
      this.rpcManager
    )

    const orderRetailService = new OrderRetailService(
      dbService,
      orderEventService,
      this.rpcManager,
      agentService,
      subgraphService,
      noteService,
      this.assetManager
    )

    this.orderRetailManager = new OrderRetailManager(
      orderRetailService,
      orderEventService,
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
      orderRetailService,
      subgraphService,
      orderEventService
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

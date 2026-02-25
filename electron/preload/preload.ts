import { contextBridge, ipcRenderer } from 'electron'
import { CancelOrderDto, OrderDto, UpdatePriceDto } from '../../core'

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => 'pong from Electron',
  getVersion: () => ipcRenderer.invoke('app:getVersion')
})

contextBridge.exposeInMainWorld('updateAPI', {
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  onStatus: (callback: (payload: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) =>
      callback(payload)
    ipcRenderer.on('app:update:status', listener)
    return () => ipcRenderer.removeListener('app:update:status', listener)
  }
})

// Account APIs
contextBridge.exposeInMainWorld('accountAPI', {
  addWallet: (
    name: string,
    address: string,
    privateKey: string,
    type: 'privateKey' | 'fireblocks'
  ) => ipcRenderer.invoke('account:addWallet', name, address, privateKey, type),
  removeWallet: (walletId: number) =>
    ipcRenderer.invoke('account:removeWallet', walletId),
  getWallets: () => ipcRenderer.invoke('account:getWallets'),
  getAssetsByChainIdAndWallet: (chainId: number, wallet: string) =>
    ipcRenderer.invoke('account:getAssetsByChainIdAndWallet', chainId, wallet),
  syncAssets: (chainId: number, wallet: string) =>
    ipcRenderer.invoke('account:syncAssets', chainId, wallet),
  syncOneAsset: (chainId: number, wallet: string, asset: string) =>
    ipcRenderer.invoke('account:syncOneAsset', chainId, wallet, asset),
  deposit: (chainId: number, wallet: string, asset: string, amount: string) =>
    ipcRenderer.invoke('account:deposit', chainId, wallet, asset, amount),
  withdraw: (chainId: number, wallet: string, asset: string, amount: string) =>
    ipcRenderer.invoke('account:withdraw', chainId, wallet, asset, amount),
  checkPrivateKeyExists: (privateKey: string) =>
    ipcRenderer.invoke('account:checkPrivateKeyExists', privateKey)
})

// Asset Pair APIs
contextBridge.exposeInMainWorld('assetPairAPI', {
  syncAssetPairs: () => ipcRenderer.invoke('assetPair:syncAssetPairs'),
  syncAssetPair: (assetPairId: string, chainId: number) =>
    ipcRenderer.invoke('assetPair:syncAssetPair', assetPairId, chainId),
  getAssetPairs: (chainId: number) =>
    ipcRenderer.invoke('assetPair:getAssetPairs', chainId)
})

// Order APIs
contextBridge.exposeInMainWorld('orderAPI', {
  createOrder: (orderDto: OrderDto) =>
    ipcRenderer.invoke('order:createOrder', orderDto),
  cancelOrder: (cancelOrderDto: CancelOrderDto) =>
    ipcRenderer.invoke('order:cancelOrder', cancelOrderDto),
  updateOrderPrice: (updatePriceDto: UpdatePriceDto) =>
    ipcRenderer.invoke('order:updateOrderPrice', updatePriceDto),
  getAllOrders: (
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ) =>
    ipcRenderer.invoke(
      'order:getAllOrders',
      chainId,
      page,
      limit,
      sort,
      status,
      search
    ),
  getOrderById: (orderId: string) =>
    ipcRenderer.invoke('order:getOrderById', orderId),
  getAssetPairs: (chainId: number) =>
    ipcRenderer.invoke('order:getAssetPairs', chainId),
  getOrderEvents: (orderId: string) =>
    ipcRenderer.invoke('order:getOrderEvents', orderId),
  getIncrementalOrderEvents: (lastEventId: number) =>
    ipcRenderer.invoke('order:getIncrementalOrderEvents', lastEventId),
  getOrderEventsByPage: (
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ) =>
    ipcRenderer.invoke(
      'order:getOrderEventsByPage',
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
})

// Auto order APIs
contextBridge.exposeInMainWorld('autoOrderAPI', {
  createJob: (jobDto: any) => ipcRenderer.invoke('autoOrder:createJob', jobDto),
  updateJob: (jobDto: any) => ipcRenderer.invoke('autoOrder:updateJob', jobDto),
  pauseJob: (jobId: string) => ipcRenderer.invoke('autoOrder:pauseJob', jobId),
  resumeJob: (jobId: string) =>
    ipcRenderer.invoke('autoOrder:resumeJob', jobId),
  cancelJob: (jobId: string) =>
    ipcRenderer.invoke('autoOrder:cancelJob', jobId),
  updateMarketPrice: (
    chainId: number,
    assetPairId: string,
    marketPrice: string
  ) =>
    ipcRenderer.invoke(
      'autoOrder:updateMarketPrice',
      chainId,
      assetPairId,
      marketPrice
    ),
  getJob: (jobId: string) => ipcRenderer.invoke('autoOrder:getJob', jobId),
  getJobsByPage: (
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ) =>
    ipcRenderer.invoke(
      'autoOrder:getJobsByPage',
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
})

// RPC Manager APIs
contextBridge.exposeInMainWorld('rpcManagerAPI', {
  getProvider: (chainId: number) =>
    ipcRenderer.invoke('rpcManager:getProvider', chainId),
  getSignerForUserSwapRelayer: (chainId: number) =>
    ipcRenderer.invoke('rpcManager:getSignerForUserSwapRelayer', chainId),
  getSignerAndPublicKey: (walletAddress: string, chainId: number) =>
    ipcRenderer.invoke(
      'rpcManager:getSignerAndPublicKey',
      walletAddress,
      chainId
    ),
  reloadProviders: () => ipcRenderer.invoke('rpcManager:reloadProviders'),
  getAllProviders: () => ipcRenderer.invoke('rpcManager:getAllProviders')
})

// Config APIs
contextBridge.exposeInMainWorld('configAPI', {
  getConfigs: () => ipcRenderer.invoke('config:getConfigs'),
  setConfigs: (configs: { [key: string]: string }) =>
    ipcRenderer.invoke('config:setConfigs', configs),
  healthCheck: (apiKey: string) =>
    ipcRenderer.invoke('config:healthCheck', apiKey)
})

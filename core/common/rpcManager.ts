import { FireblocksWeb3Provider } from '@fireblocks/fireblocks-web3-provider'
import { DarkSwapError } from '@thesingularitynetwork/darkswap-sdk'
import { ethers } from 'ethers'
import { DarkSwapConfig, WalletConfig } from '../types'

export class RpcManager {
  private providers: Map<number, ethers.JsonRpcProvider>
  private signers: Map<string, [ethers.Signer, string]>
  private config: DarkSwapConfig

  public constructor(config: DarkSwapConfig) {
    this.providers = new Map()
    this.signers = new Map()
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders() {
    this.config.chainRpcs.forEach(({ chainId, rpcUrl }) => {
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      this.providers.set(chainId, provider)
    })
  }

  public getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId)
    if (!provider) {
      throw new DarkSwapError(`No provider found for chainId: ${chainId}`)
    }
    return provider
  }

  public getSignerForUserSwapRelayer(chainId: number): ethers.Signer | null {
    const userSwapRelayerPrivateKey = this.config.userSwapRelayerPrivateKey

    if (!userSwapRelayerPrivateKey) {
      return null
    }

    const provider = this.getProvider(chainId)
    return new ethers.Wallet(userSwapRelayerPrivateKey, provider)
  }

  public getSignerAndPublicKey(
    walletAddress: string,
    chainId: number
  ): [ethers.Signer, string] {
    const key = `${walletAddress}-${chainId}`
    if (this.signers.has(key)) {
      return this.signers.get(key)!
    }

    const wallet = this.config.wallets.find(
      (w) => w.address.toLowerCase() === walletAddress.toLowerCase()
    )

    if (!wallet) {
      throw new DarkSwapError(`No wallet found for address: ${walletAddress}`)
    }

    const provider = this.getProvider(chainId)
    let signer: ethers.Signer
    if (wallet.type === 'privateKey') {
      signer = this.getSignerForPrivateKey(wallet, provider)
    } else if (wallet.type === 'fireblocks') {
      signer = this.getSignerForFireblocks(wallet, chainId)
    } else {
      throw new DarkSwapError('Invalid wallet type')
    }
    const publicKey = '0x'
    this.signers.set(key, [signer, publicKey])
    return [signer, publicKey]
  }

  private getSignerForPrivateKey(
    wallet: WalletConfig,
    provider: ethers.JsonRpcProvider
  ): ethers.Signer {
    if (wallet.type === 'privateKey' && wallet.privateKey) {
      return new ethers.Wallet(wallet.privateKey, provider)
    }
    throw new DarkSwapError('Invalid wallet type')
  }

  private getSignerForFireblocks(
    wallet: WalletConfig,
    chainId: number
  ): ethers.Signer {
    if (wallet.type !== 'fireblocks') {
      throw new DarkSwapError('Invalid wallet type')
    }

    const fireblocksConfig = this.config.fireblocks
    if (!fireblocksConfig) {
      throw new DarkSwapError('Fireblocks config not found')
    }
    const eip1193Provider = new FireblocksWeb3Provider({
      privateKey: fireblocksConfig.privateKey,
      apiKey: fireblocksConfig.apiKey,
      vaultAccountIds: wallet.address,
      chainId
    })
    if (fireblocksConfig.apiBaseUrl) {
      eip1193Provider.setApiBaseUrl(fireblocksConfig.apiBaseUrl)
    }
    return eip1193Provider.getSigner()
  }

  public reloadProviders() {
    this.providers.clear()
    this.signers.clear()
    this.initializeProviders()
  }
}

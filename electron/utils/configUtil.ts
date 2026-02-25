import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { z } from 'zod'

import { ConfigSchema, Config } from './configValidator'
import { ethers } from 'ethers'
import { app } from 'electron'
import * as path from 'path'

export class ConfigLoader {
  private config?: Config = undefined
  private static instance: ConfigLoader

  constructor() {
    this.loadConfig()
  }

  private parseCommandLineArgs(): string | null {
    const args = process.argv.slice(2)
    for (let i = 0; i < args.length; i++) {
      const [key, value] = args[i].split('=')
      if (key === 'config') {
        return value
      }
    }
    return null
  }

  private loadConfig() {
    try {
      const configPath = app.isPackaged
        ? // Build version
          path.join(process.resourcesPath, 'config.yaml')
        : // Dev version

          path.join(
            process.cwd(),
            this.parseCommandLineArgs() || 'config/testnet/config.yaml'
          )

      const fileContent = fs.readFileSync(configPath, 'utf8')
      this.config = yaml.load(fileContent) as Config

      const parsedConfig = ConfigSchema.parse(this.config)

      if (parsedConfig.userSwapRelayerPrivateKey) {
        if (
          !parsedConfig.userSwapRelayerAddress ||
          !ethers.isAddress(parsedConfig.userSwapRelayerAddress)
        ) {
          throw new Error(
            'User swap relayer address and privatekey is not valid'
          )
        }

        const wallet = new ethers.Wallet(parsedConfig.userSwapRelayerPrivateKey)
        if (
          wallet.address.toLowerCase() !=
          parsedConfig.userSwapRelayerAddress.toLowerCase()
        ) {
          throw new Error(
            'User swap relayer address is not aligned with privatekey'
          )
        }
      }

      this.config = parsedConfig
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Failed to validate configuration:', error.issues)
      } else {
        console.error('Failed to load configuration:', error)
      }
      process.exit(1)
    }
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader()
    }
    return ConfigLoader.instance
  }

  public getConfig() {
    return this.config
  }

  public getWallets() {
    return this.config ? this.config.wallets : []
  }
}

// export function configToDarkSwapConfig(config: Config): DarkSwapConfig {
//   return {
//     wallets: config.wallets.map((wallet) => ({
//       type: wallet.type,
//       name: wallet.name,
//       address: wallet.address,
//       privateKey: wallet.privateKey
//     })),
//     chainRpcs: config.chainRpcs.map((chainRpc) => ({
//       chainId: chainRpc.chainId,
//       rpcUrl: chainRpc.rpcUrl
//     })),
//     dbFilePath: config.dbFilePath,
//     bookNodeSocketUrl: config.bookNodeSocketUrl,
//     bookNodeApiUrl: config.bookNodeApiUrl,
//     bookNodeApiKey: config.bookNodeApiKey,
//     userSwapRelayerAddress: config.userSwapRelayerAddress,
//     userSwapRelayerPrivateKey: config.userSwapRelayerPrivateKey
//   }
// }

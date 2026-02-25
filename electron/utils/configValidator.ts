import { z } from 'zod'

const WalletSchema = z.object({
  name: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  privateKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  type: z.enum(['privateKey', 'fireblocks']).default('privateKey')
})

const RelayerSchema = z.object({
  relayerName: z.string(),
  relayerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  hostUrl: z.string().url(),
  chainId: z.number()
})

const ChainRpcSchema = z.object({
  chainId: z.number(),
  rpcUrl: z.string().url()
})

const ProofOptionsSchema = z.object({
  threads: z.number().optional(),
  memory: z.number().optional()
})

const dbFilePathScema = z.string().nonempty()
const bookNodeSocketUrlScema = z.string().url().optional()
const bookNodeApiUrlSchema = z.string().url().optional()
const bookNodeApiKeySchema = z.string().nonempty().optional()
const userSwapRelayerAddressSchema = z.string().optional()
const userSwapRelayerPrivateKeySchema = z.string().optional()
const autoUpdateUrlSchema = z.string().url().optional()

const FireblocksConfigSchema = z.object({
  privateKey: z.string().nonempty(),
  apiKey: z.string().nonempty(),
  apiBaseUrl: z.string().url().optional()
})

export const ConfigSchema = z
  .object({
    wallets: z.array(WalletSchema).optional().default([]),
    singularityRelayers: z.array(RelayerSchema).optional(),
    chainRpcs: z.array(ChainRpcSchema),
    dbFilePath: dbFilePathScema,
    bookNodeSocketUrl: bookNodeSocketUrlScema,
    bookNodeApiUrl: bookNodeApiUrlSchema,
    bookNodeApiKey: bookNodeApiKeySchema.optional(),
    userSwapRelayerAddress: userSwapRelayerAddressSchema,
    userSwapRelayerPrivateKey: userSwapRelayerPrivateKeySchema,
    autoUpdateUrl: autoUpdateUrlSchema,
    proofOptions: ProofOptionsSchema.optional(),
    fireblocks: FireblocksConfigSchema.optional()
  })
  .refine(
    (data) => {
      const hasFireblocksWallet = data.wallets.some(
        (wallet) => wallet.type === 'fireblocks'
      )

      if (hasFireblocksWallet && !data.fireblocks) {
        return false
      }

      return true
    },
    {
      message:
        'Fireblocks configuration is required when using fireblocks wallet type',
      path: ['fireblocks']
    }
  )

export function validateConfig(config: unknown) {
  try {
    const validatedConfig = ConfigSchema.parse(config)
    return {
      isValid: true,
      config: validatedConfig,
      errors: null
    }
  } catch (error) {
    return {
      isValid: false,
      config: null,
      errors: error
    }
  }
}

export type WalletConfig = z.infer<typeof WalletSchema>
export type RelayerConfig = z.infer<typeof RelayerSchema>
export type ChainRpcConfig = z.infer<typeof ChainRpcSchema>
export type DbFilePathConfig = z.infer<typeof dbFilePathScema>
export type BookNodeSocketUrlConfig = z.infer<typeof bookNodeSocketUrlScema>
export type BookNodeApiUrlConfig = z.infer<typeof bookNodeApiUrlSchema>
export type BookNodeApiKeyConfig = z.infer<typeof bookNodeApiKeySchema>
export type Config = z.infer<typeof ConfigSchema>
export type FireblocksConfig = z.infer<typeof FireblocksConfigSchema>

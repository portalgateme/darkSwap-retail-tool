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

const ChainRpcSchema = z.object({
  chainId: z.number(),
  rpcUrl: z.string().url()
})

const ProofOptionsSchema = z.object({
  threads: z.number().optional(),
  memory: z.number().optional()
})

const dbFilePathScema = z.string().nonempty()
const agentUrlSchema = z.string().url().optional()

export const ConfigSchema = z
  .object({
    wallets: z.array(WalletSchema).optional().default([]),
    chainRpcs: z.array(ChainRpcSchema),
    dbFilePath: dbFilePathScema,
    agentUrl: agentUrlSchema,
    proofOptions: ProofOptionsSchema.optional()
  })

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
export type ChainRpcConfig = z.infer<typeof ChainRpcSchema>
export type DbFilePathConfig = z.infer<typeof dbFilePathScema>
export type AgentUrlConfig = z.infer<typeof agentUrlSchema>
export type Config = z.infer<typeof ConfigSchema>
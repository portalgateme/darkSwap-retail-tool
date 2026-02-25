import { DarkSwapContext } from '../common/context/darkSwap.context'
import { AuthInfo } from '../types'

export const getAuthInfo = async (
  context: DarkSwapContext
): Promise<AuthInfo> => {
  const timestamp = new Date().toISOString()
  const message = `${context.walletAddress.toLowerCase()} is logging in to Singularity Protocol at ${timestamp}`
  const signature = await context.signer.signMessage(message)
  //store signature in local storage
  const signatureItem: AuthInfo = {
    signature,
    wallet: context.walletAddress,
    timestamp
  }
  return signatureItem
}

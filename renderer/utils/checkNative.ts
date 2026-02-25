import { nativeToken } from '../constants/tokenConfig'

export const isNativeToken = (
  chainId: number,
  tokenAddress: string
): boolean => {
  return (
    nativeToken[chainId].address.toLowerCase() === tokenAddress.toLowerCase()
  )
}

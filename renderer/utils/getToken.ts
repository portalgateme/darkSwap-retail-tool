import { tokenConfig } from '../constants/tokenConfig'

export const getTokenFromContract = (
  address?: string | null,
  chainId?: number
) => {
  if (!address || !chainId) return
  return tokenConfig[chainId].find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  )
}

import { ethers } from 'ethers'
import { useChainContext } from '../contexts/ChainContext/hooks'
import { isNativeToken } from '../utils/checkNative'
import ERC20_ABI from '../abis/ERC20.json'

export const useTokenBalance = () => {
  const { provider } = useChainContext()
  const getBalance = async (
    chainId: number,
    address: string,
    tokenAddress: string
  ): Promise<bigint> => {
    if (!provider) return BigInt(0)
    try {
      if (isNativeToken(chainId, tokenAddress)) {
        const balance = await provider.getBalance(address)
        return balance
      } else {
        const contract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI.abi,
          provider
        )
        const balance: bigint = await contract.balanceOf(address)
        return balance
      }
    } catch (error) {
      console.error('Error getting token balance:', error)
      return BigInt(0)
    }
  }

  const getBalances = async (
    chainId: number,
    address: string,
    tokenAddresses: string[]
  ): Promise<Record<string, bigint>> => {
    const balances: Record<string, bigint> = {}
    for (const tokenAddress of tokenAddresses) {
      const balance = await getBalance(chainId, address, tokenAddress)
      balances[tokenAddress] = balance
    }
    return balances
  }

  return { getBalance, getBalances }
}

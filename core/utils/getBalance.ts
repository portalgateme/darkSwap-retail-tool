import { Contract, Provider } from 'ethers'
import { isSameAddress } from '../../renderer/utils/format'
import { networkConfig } from '../config/networkConfig'

export const getBalance = async (
  token: string,
  wallet: string,
  chainId: number,
  provider: Provider
) => {
  if (isSameAddress(token, networkConfig[chainId].ethAddress)) {
    const balance = await provider.getBalance(wallet)
    console.log(`Balance of wallet ${wallet} for token ${token} is ${balance}`)
    return balance
  }
  const contract = new Contract(
    token,
    ['function balanceOf(address owner) view returns (uint256)'],
    provider
  )
  const balance = (await contract.balanceOf(wallet)) as bigint
  console.log(`Balance of wallet ${wallet} for token ${token} is ${balance}`)
  return balance
}

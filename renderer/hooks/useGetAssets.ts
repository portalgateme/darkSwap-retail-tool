import { useEffect, useState } from 'react'
import { useAccountContext } from '../contexts/AccountContext/hooks'
import { useChainContext } from '../contexts/ChainContext/hooks'
import { MyAssetsDto } from '../types'

export const useGetAssets = () => {
  const [listData, setListData] = useState<MyAssetsDto>()

  const { selectedAccount } = useAccountContext()
  const { chainId } = useChainContext()

  const fetchAssets = async (chainId: number, address: string) => {
    // @ts-ignore
    const assets = await window.accountAPI.getAssetsByChainIdAndWallet(
      chainId,
      address
    )
    console.log('Fetched assets:', assets)
    setListData(assets)
  }

  const syncAssets = async (address: string, chainId: number) => {
    if (!selectedAccount || !chainId) return

    try {
      console.log('params =>>>', chainId, address)
      //@ts-ignore
      await window.accountAPI.syncAssets(chainId, address)
      await fetchAssets(chainId, address)
    } catch (error) {
      console.error('Sync assets failed:', error)
    }
  }

  useEffect(() => {
    if (!selectedAccount || !chainId) return
    fetchAssets(chainId, selectedAccount.address)
  }, [chainId, selectedAccount])

  return { listData, fetchAssets, syncAssets }
}

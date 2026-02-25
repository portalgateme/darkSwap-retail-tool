import { ethers } from 'ethers'
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect
} from 'react'
import { useChainContext } from '../ChainContext/hooks'
import { AssetPairDto } from '../../types'
import { set } from 'zod'

interface AssetPairContextType {
  list: AssetPairDto[]
  assetPair?: AssetPairDto
  onChangeAssetPair?: (pair: AssetPairDto) => void
}

export const AssetPairContext = createContext<AssetPairContextType>({
  list: [],
  assetPair: undefined,
  onChangeAssetPair: () => {}
})

export const AssetPairProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [list, setList] = useState<AssetPairDto[]>([])
  const [assetPair, setAssetPair] = useState<AssetPairDto>()
  const { chainId } = useChainContext()

  const fetchAssetPairs = async (chainId: number) => {
    // @ts-ignore
    const assetPairs = (await window.assetPairAPI.getAssetPairs(
      chainId
    )) as AssetPairDto[]

    setList(assetPairs)

    const currentPair = assetPairs[0]
    if (!currentPair) return
    setAssetPair(currentPair)
  }

  useEffect(() => {
    if (!chainId) return
    fetchAssetPairs(chainId)
  }, [chainId])

  return (
    <AssetPairContext.Provider
      value={{
        list,
        assetPair,
        onChangeAssetPair: setAssetPair
      }}
    >
      {children}
    </AssetPairContext.Provider>
  )
}

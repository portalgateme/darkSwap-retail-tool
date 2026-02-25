import { useContext } from 'react'
import { AssetPairContext } from './AssetPairProvider'

export const useAssetPairContext = () => useContext(AssetPairContext)

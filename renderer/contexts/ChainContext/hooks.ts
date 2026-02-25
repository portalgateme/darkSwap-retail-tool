import { useContext } from 'react'
import { ChainContext } from './ChainProvider'

export const useChainContext = () => useContext(ChainContext)

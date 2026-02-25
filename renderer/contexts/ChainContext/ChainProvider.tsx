import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect
} from 'react'
import { Network } from '../../types'
import { chains } from '../../constants/networkConfig'
import { ethers, Provider } from 'ethers'

interface ChainContextType {
  chainId?: number
  currentChain?: Network
  provider?: Provider
  supportedChains: Network[]
  onChangeChain: (chainId: Network) => void
}

export const ChainContext = createContext<ChainContextType>({
  chainId: undefined,
  currentChain: undefined,
  provider: undefined,
  supportedChains: [],
  onChangeChain: () => {}
})

export const ChainProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [chainId, setChainId] = useState<number>()
  const [currentChain, setCurrentChain] = useState<Network>()
  const [supportedChains, setSupportedChains] = useState<Network[]>([])
  const [provider, setProvider] = useState<Provider>()

  const getSupportChains = async () => {
    const supportedChains =
      // @ts-ignore
      (await window.rpcManagerAPI.getAllProviders()) as Array<{
        chainId: number
        rpcUrl: string
      }>

    console.log('Supported chains from rpcManagerAPI:', supportedChains)

    return chains.filter((chain) =>
      supportedChains.some(
        (supportedChain) => supportedChain.chainId === chain.chainId
      )
    )
  }

  const onChangeChain = (newChain: Network) => {
    setChainId(newChain.chainId)
    setCurrentChain(newChain)
    setProvider(new ethers.JsonRpcProvider(newChain.rpcUrl))
  }

  useEffect(() => {
    // Set default chain on mount
    getSupportChains().then((supportedChains) => {
      console.log('Filtered supported chains:', supportedChains)
      setSupportedChains(supportedChains)
      const defaultChain = supportedChains[0]
      setChainId(defaultChain.chainId)
      setCurrentChain(defaultChain)
      setProvider(new ethers.JsonRpcProvider(defaultChain.rpcUrl))
    })
  }, [])

  return (
    <ChainContext.Provider
      value={{
        chainId,
        onChangeChain,
        supportedChains,
        currentChain,
        provider
      }}
    >
      {children}
    </ChainContext.Provider>
  )
}

import { useChainContext } from '../../contexts/ChainContext/hooks'

export const NetworkLabel = ({ chainId }: { chainId: number }) => {
  const { supportedChains } = useChainContext()
  return (
    supportedChains.find((chain) => chain.chainId === chainId)?.name ||
    'Unknown'
  )
}

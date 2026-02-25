import { DarkSwap, DarkSwapError } from '@thesingularitynetwork/darkswap-sdk'
import { Signer } from 'ethers'
import { networkConfig } from '../config/networkConfig'

export function getDarkSwap(chainId: number, signer: Signer) {
  if (!networkConfig[chainId]) {
    throw new DarkSwapError(`ChainId ${chainId} not supported`)
  }

  const darkSwap = new DarkSwap(
    signer,
    chainId,
    //contractConfig[chainId]
    {
      priceOracle: networkConfig[chainId].priceOracle,
      ethAddress: networkConfig[chainId].ethAddress,
      nativeWrapper: networkConfig[chainId].nativeWrapper,
      merkleTreeOperator: networkConfig[chainId].merkleTreeOperator,
      darkSwapAssetManager: networkConfig[chainId].darkSwapAssetManager,
      darkSwapFeeAssetManager: networkConfig[chainId].darkSwapFeeAssetManager
    }
  )

  return darkSwap
}

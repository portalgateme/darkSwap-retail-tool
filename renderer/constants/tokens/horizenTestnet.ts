import { Token } from '../../types'

export const horizenTestnetTokens: Token[] = [
  {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: '/tokens/ETH.png'
  },
  //   {
  //     address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  //     symbol: 'WETH',
  //     name: 'Wrapped Ether',
  //     decimals: 18,
  //     logoURI: '/tokens/WETH.png'
  //   },
  {
    address: '0x152f1051c8D37Fba9A362Fc9b32a0eeF8496202F',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: '/tokens/USDC.png'
  }
]

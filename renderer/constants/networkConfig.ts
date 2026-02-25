import { Network } from '../types'

export const chains: Network[] = [
  {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    icon: '/chain/ethereum.png'
  },
  {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    icon: '/chain/arbitrum.svg'
  },
  {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://base-mainnet.public.blastapi.io',
    icon: '/chain/base.svg'
  },
  {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com/',
    icon: '/chain/polygon.svg'
  },
  {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://0xrpc.io/sep',
    icon: '/chain/ethereum.png',
    isTestnet: true
  },
  {
    name: 'Hardhat',
    chainId: 31337,
    rpcUrl: 'http://app.dev.portalgate.me:18544',
    icon: '/chain/ethereum.png',
    isTestnet: true
  },
  {
    name: 'HardhatBase',
    chainId: 31339,
    rpcUrl: 'https://app.dev.portalgate.me:38545',
    icon: '/chain/base.svg',
    isTestnet: true
  },
  {
    name: 'Horizen Testnet',
    chainId: 845320009,
    rpcUrl: 'https://horizen-rpc-testnet.appchain.base.org/',
    icon: '/chain/horizen.svg',
    isTestnet: true
  }
]

export enum ChainId {
  MAINNET = 1,
  SEPOLIA = 11155111,
  HARDHAT = 31337,
  HARDHAT_BASE = 31339,
  HORIZEN_TESTNET = 845320009,
  BASE = 8453
}

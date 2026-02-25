import { Stack, Typography } from '@mui/material'
import Image from 'next/image'
import { getTokenFromContract } from '../../utils/getToken'
import { useChainContext } from '../../contexts/ChainContext/hooks'

interface TokenLabelProps {
  token?: string
  showSymbol?: boolean
}

export const TokenLabel: React.FC<TokenLabelProps> = ({
  token,
  showSymbol = true
}) => {
  const { chainId } = useChainContext()
  const asset = getTokenFromContract(token, chainId)
  return (
    <Stack
      direction={'row'}
      spacing={1}
      alignItems='center'
    >
      <Image
        src={asset?.logoURI ?? '/tokens/default-token.svg'}
        alt={asset?.symbol ?? 'token image'}
        width={24}
        height={24}
      />
      {showSymbol && <Typography color='#fff'>{asset?.symbol}</Typography>}
    </Stack>
  )
}

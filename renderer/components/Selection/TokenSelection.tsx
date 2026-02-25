import React from 'react'
import {
  MenuItem,
  Stack,
  Typography,
  Menu,
  Box,
  Button,
  SxProps
} from '@mui/material'

import { Account, Token } from '../../types'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { shorterAddress } from '../../utils/format'
import { tokenConfig } from '../../constants/tokenConfig'
import Image from 'next/image'
import { useChainContext } from '../../contexts/ChainContext/hooks'

interface TokenSelection {
  selectedToken?: Token
  onTokenChange: (token: Token) => void
  fullWidth?: boolean
  buttonSx?: SxProps
  menuSx?: SxProps
  sx?: SxProps
}

const TokenSelection: React.FC<TokenSelection> = ({
  selectedToken,
  onTokenChange,
  fullWidth = false,
  buttonSx,
  menuSx,
  sx
}) => {
  const { chainId } = useChainContext()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const onSelectToken = (token: Token) => {
    onTokenChange(token)
    handleClose()
  }

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'fit-content', ...sx }}>
      <Button
        variant='contained'
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          background: '#1E2128',
          borderRadius: '8px',
          textTransform: 'capitalize',
          justifyContent: 'space-between',
          ...buttonSx
        }}
        fullWidth
        onClick={handleClick}
      >
        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
        >
          {selectedToken && (
            <Image
              src={selectedToken.logoURI || '/tokens/default-token.svg'}
              alt={selectedToken.symbol}
              width={24}
              height={24}
            />
          )}
          <Typography variant='body1'>
            {selectedToken ? selectedToken.name : 'Select Token'}
          </Typography>
        </Stack>
      </Button>

      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl?.offsetWidth || 'auto',
              background: 'none'
            }
          },
          list: {
            'aria-labelledby': 'basic-button',
            sx: {
              background: '#1E2128',
              color: '#F3F4F6'
            }
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        {chainId &&
          tokenConfig[chainId] &&
          tokenConfig[chainId].map((token, index) => (
            <MenuItem
              key={index}
              onClick={() => onSelectToken(token)}
              sx={{
                '&:hover': { backgroundColor: '#2A2E33' }
              }}
            >
              <Stack
                spacing={1}
                direction='row'
                alignItems='center'
              >
                <Image
                  src={token.logoURI || '/default-token.png'}
                  alt={token.name || 'token'}
                  width={24}
                  height={24}
                />
                <Typography>{token.name}</Typography>
              </Stack>
            </MenuItem>
          ))}
      </Menu>
    </Box>
  )
}

export default TokenSelection

import React, { useMemo } from 'react'
import {
  MenuItem,
  Stack,
  Typography,
  Menu,
  Box,
  Button,
  SxProps
} from '@mui/material'

import { Wallet } from '../../types'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { shorterAddress } from '../../utils/format'
import { useAccountContext } from '../../contexts/AccountContext/hooks'

interface AccountSelectionProps {
  selectedAccount?: Wallet
  onAccountChange: (account: Wallet) => void
  fullWidth?: boolean
  buttonSx?: SxProps
  menuSx?: SxProps
}

const AccountSelection: React.FC<AccountSelectionProps> = ({
  selectedAccount,
  onAccountChange,
  fullWidth = false,
  buttonSx,
  menuSx
}) => {
  const { accounts } = useAccountContext()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const onSelectAccount = (account: Wallet) => {
    onAccountChange(account)
    handleClose()
  }

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'fit-content' }}>
      <Button
        variant='contained'
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          background: '#1E2128',
          borderRadius: '8px',
          textTransform: 'capitalize',
          justifyContent: fullWidth ? 'space-between' : 'flex-start',
          ...buttonSx
        }}
        fullWidth
        onClick={handleClick}
      >
        <Typography variant='body1'>
          {selectedAccount ? (
            <>
              <Stack
                direction={'row'}
                alignItems={'center'}
                spacing={1}
              >
                <Typography>{selectedAccount.name}</Typography>
                <Typography
                  variant='body2'
                  color='#BDC1CA'
                >
                  ({shorterAddress(selectedAccount.address)})
                </Typography>
              </Stack>
            </>
          ) : (
            'Select Account'
          )}
        </Typography>
      </Button>

      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              //       width: anchorEl?.offsetWidth || 'auto',
              background: 'none'
            }
          },
          list: {
            'aria-labelledby': 'basic-button',
            sx: {
              background: '#1E2128',
              color: '#F3F4F6',
              minWidth: '220px'
            }
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        {accounts.map((account, index) => (
          <MenuItem
            key={index}
            onClick={() => onSelectAccount(account)}
            sx={{
              '&:hover': { backgroundColor: '#2A2E33' }
            }}
          >
            <Stack
              width={'100%'}
              direction='row'
              alignItems='center'
              justifyContent={'space-between'}
            >
              <Typography>{account.name}</Typography>
              <Typography
                variant='body2'
                color='#BDC1CA'
              >
                ({shorterAddress(account.address)})
              </Typography>
              {/* <Typography>{account}</Typography> TODO: Should be show balance */}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default AccountSelection

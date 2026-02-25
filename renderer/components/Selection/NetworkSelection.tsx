import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Menu,
  Box,
  Button,
  SxProps
} from '@mui/material'
import Image from 'next/image'
import { Network } from '../../types'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useChainContext } from '../../contexts/ChainContext/hooks'

interface NetworkSelectionProps {
  selectedNetwork?: Network
  onNetworkChange: (network: Network) => void
  fullWidth?: boolean
  buttonSx?: SxProps
  menuSx?: SxProps
}

const NetworkSelection: React.FC<NetworkSelectionProps> = ({
  selectedNetwork,
  onNetworkChange,
  fullWidth = false,
  buttonSx,
  menuSx
}) => {
  const { supportedChains } = useChainContext()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const onSelectNetwork = (network: Network) => {
    onNetworkChange(network)
    handleClose()
  }

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'fit-content' }}>
      <Button
        variant='contained'
        startIcon={
          selectedNetwork &&
          selectedNetwork.icon && (
            <Image
              src={selectedNetwork.icon}
              alt={selectedNetwork.name}
              width={24}
              height={24}
            />
          )
        }
        sx={{
          background: '#1E2128',
          borderRadius: '8px',
          textTransform: 'capitalize',
          justifyContent: 'flex-start',
          boxShadow: 'none',
          minWidth: '220px',
          ...buttonSx
        }}
        fullWidth
        onClick={handleClick}
      >
        <Stack
          width={'100%'}
          direction='row'
          spacing={1}
          alignItems='center'
          justifyContent='space-between'
        >
          <Typography variant='body1'>
            {selectedNetwork ? selectedNetwork.name : 'Select Network'}
          </Typography>
          <KeyboardArrowDownIcon />
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
        {supportedChains.map((network) => (
          <MenuItem
            key={network.chainId}
            onClick={() => onSelectNetwork(network)}
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
                src={network.icon}
                alt={network.name}
                width={24}
                height={24}
              />
              <Typography>{network.name}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default NetworkSelection

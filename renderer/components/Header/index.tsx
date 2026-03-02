import { Box, Button, Popover, Stack, Typography } from '@mui/material'
import { Network, Wallet } from '../../types'
import { useEffect, useState } from 'react'
import NetworkSelection from '../Selection/NetworkSelection'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { shorterAddress } from '../../utils/format'
import { SelectAccountModal } from '../Modal/SelectAccountModal'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { nativeToken, tokenConfig } from '../../constants/tokenConfig'
import { ethers } from 'ethers'
import { ChainId } from '../../constants/networkConfig'
import { TokenLabel } from '../Label/TokenLabel'
import Image from 'next/image'
import { getTokenFromContract } from '../../utils/getToken'

interface HeaderProps {
  title: string
}
export const Header = ({ title }: HeaderProps) => {
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  // const { getBalances } = useTokenBalance()

  const { selectedAccount, setSelectedAccount, setOpenAddModal } =
    useAccountContext()
  const { onChangeChain, currentChain, chainId } = useChainContext()

  const onOpenSelectAccount = () => {
    setOpenModal(true)
  }

  const onCloseModal = () => {
    setOpenModal(false)
  }

  const onChangeAccount = (account: Wallet) => {
    setSelectedAccount(account)
    onCloseModal()
  }

  // useEffect(() => {
  //   if (!chainId || !selectedAccount) return
  //   getBalances(
  //     chainId,
  //     selectedAccount.address,
  //     tokenConfig[chainId].map((token) => token.address)
  //   ).then((bal) => {
  //     const formattedBalances: Record<string, string> = {}
  //     for (const [tokenAddress, balance] of Object.entries(bal)) {
  //       const token = getTokenFromContract(tokenAddress, chainId)
  //       if (token) {
  //         const formattedBalance = ethers.formatUnits(balance, token.decimals)
  //         formattedBalances[tokenAddress] = new Intl.NumberFormat('en-US', {
  //           maximumFractionDigits: 6
  //         }).format(Number(formattedBalance))
  //       }
  //     }
  //     setBalances(formattedBalances)
  //   })
  // }, [selectedAccount, currentChain])

  // const nativeTokenBalance = chainId
  //   ? balances[
  //       nativeToken[chainId]?.address ??
  //         '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
  //     ] || '0'
  //   : '0'

  // const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorEl(event.currentTarget)
  // }

  // const handlePopoverClose = () => {
  //   setAnchorEl(null)
  // }

  // const open = Boolean(anchorEl)
  return (
    <Stack
      direction={'row'}
      justifyContent='space-between'
      alignItems='center'
    >
      <Typography
        color='#F3F4F6'
        variant='h3'
        fontWeight={700}
      >
        {title}
      </Typography>

      <Stack
        direction={'row'}
        spacing={2}
      >
        <NetworkSelection
          selectedNetwork={currentChain}
          onNetworkChange={onChangeChain}
        />

        <Stack
          direction={'row'}
          alignItems={'center'}
          spacing={1}
        >
          {/* Balance */}
          {/* <Stack
            direction={'row'}
            alignItems={'center'}
            sx={{
              background: '#1E2128',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            spacing={1}
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}
          >
            <Image
              src={
                nativeToken[chainId ?? ChainId.SEPOLIA].logoURI ??
                '/tokens/default-token.svg'
              }
              alt={nativeToken[chainId ?? ChainId.SEPOLIA].symbol}
              width={24}
              height={24}
            />
            <Typography
              variant='body1'
              color='white'
            >
              {nativeTokenBalance}
            </Typography>

            <Typography
              variant='body1'
              color='white'
            >
              {nativeToken[chainId ?? ChainId.SEPOLIA].symbol}
            </Typography>
          </Stack> */}

          <Button
            variant='contained'
            startIcon={<AccountBalanceWalletIcon />}
            sx={{
              background: '#1E2128',
              borderRadius: '8px',
              textTransform: 'capitalize'
            }}
            onClick={onOpenSelectAccount}
          >
            <Typography variant='body1'>
              {selectedAccount
                ? shorterAddress(selectedAccount.address)
                : 'Connect Wallet'}
            </Typography>
          </Button>
        </Stack>

        {/* <Popover
          id='mouse-over-popover'
          sx={{
            pointerEvents: 'none'
          }}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          slotProps={{
            paper: {
              sx: {
                background: 'none'
              }
            }
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
        >
          <Box sx={{ p: 2, backgroundColor: '#1E2128', overflow: 'hidden' }}>
            {chainId &&
              Object.entries(balances).map(([tokenAddress, balance]) => {
                const token = getTokenFromContract(tokenAddress, chainId)
                if (!token) return null
                return (
                  <Stack
                    key={tokenAddress}
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    spacing={2}
                    sx={{ mb: 1 }}
                  >
                    <TokenLabel
                      token={tokenAddress}
                      showSymbol={false}
                    />
                    <Typography
                      variant='body1'
                      color='white'
                    >
                      {balance}
                    </Typography>
                  </Stack>
                )
              })}
          </Box>
        </Popover> */}
      </Stack>

      <SelectAccountModal
        open={openModal}
        onClose={onCloseModal}
        onSelectAccount={onChangeAccount}
      />
    </Stack>
  )
}

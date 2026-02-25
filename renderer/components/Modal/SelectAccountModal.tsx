import {
  Avatar,
  Box,
  Button,
  InputBase,
  Modal,
  Stack,
  TextareaAutosize,
  Typography
} from '@mui/material'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { shorterAddress } from '../../utils/format'
import { useEffect, useState } from 'react'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { Wallet } from '../../types'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { ethers } from 'ethers'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
interface SelectAccountModalProps {
  open: boolean
  onClose: () => void
  onSelectAccount?: (account: Wallet) => void
}

export const SelectAccountModal = ({
  open,
  onClose,
  onSelectAccount
}: SelectAccountModalProps) => {
  const [search, setSearch] = useState<string>('')
  const [balances, setBalances] = useState<Record<string, string>>({})
  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }
  const { accounts, setOpenAddModal, onRemoveAccount, selectedAccount } =
    useAccountContext()
  const { currentChain } = useChainContext()

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(search.toLowerCase())
  )

  const onAddAccount = () => {
    setOpenAddModal(true)
    onClose()
  }

  const balanceOfWallet = async (address: string) => {
    if (!currentChain) return '0'
    const balance = await new ethers.JsonRpcProvider(
      currentChain.rpcUrl
    ).getBalance(address)
    return Number(ethers.formatEther(balance)).toFixed(6)
  }

  useEffect(() => {
    const fetchBalances = async () => {
      const newBalances: Record<string, string> = {}
      for (const account of filteredAccounts) {
        newBalances[account.address] = await balanceOfWallet(account.address)
      }
      setBalances(newBalances)
    }
    if (open && currentChain) {
      fetchBalances()
    }
  }, [open, currentChain, filteredAccounts])
  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Stack
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          minHeight: 400,
          background: '#1E2128',
          borderRadius: '20px',
          p: 5,
          outline: 'none'
        }}
      >
        <Typography
          textAlign={'center'}
          color='#F3F4F6'
          variant='h5'
        >
          Select a wallet
        </Typography>
        <Stack
          direction={'row'}
          alignItems='center'
          mt={2}
          gap={1}
          sx={{
            border: '1px solid #DEE1E6',
            borderRadius: '6px',
            p: 1
          }}
        >
          <SearchIcon sx={{ color: '#565D6D' }} />
          <InputBase
            placeholder='Search wallet'
            sx={{
              padding: 0,
              color: 'white',
              '::placeholder': {
                color: '#565D6D'
              }
            }}
            value={search}
            onChange={onChangeSearch}
          />
        </Stack>

        <Stack
          mt={2}
          spacing={2}
        >
          {filteredAccounts.map((account, index) => (
            <Stack
              key={index}
              direction={'row'}
              alignItems={'center'}
              justifyContent='space-between'
              sx={{
                padding: '12px',
                borderRadius: '4px',
                background: '#323743'
              }}
            >
              <Stack
                flex={1}
                direction={'row'}
                alignItems='center'
                justifyContent={'space-between'}
                onClick={() => onSelectAccount && onSelectAccount(account)}
              >
                {/* Avatar */}
                <Avatar>{account.name.substring(0, 2)}</Avatar>
                <Stack ml={2}>
                  <Typography
                    variant='body2'
                    color='white'
                  >
                    {account.name}

                    {selectedAccount?.id === account.id && (
                      <CheckCircleIcon
                        sx={{ ml: 1, fontSize: 16, fill: '#68EB8E' }}
                      />
                    )}
                  </Typography>
                  <Typography
                    variant='caption'
                    color='#D0D0D0'
                  >
                    {shorterAddress(account.address)}
                  </Typography>
                </Stack>

                <Typography
                  variant='body1'
                  color='white'
                  ml={'auto'}
                >
                  {balances[account.address] || '0'}
                </Typography>
              </Stack>

              <DeleteOutlineIcon
                sx={{ fill: '#FF0000', cursor: 'pointer', ml: '16px' }}
                onClick={() => onRemoveAccount(account.id)}
              />
            </Stack>
          ))}
        </Stack>

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          sx={{
            background: '#68EB8E',
            color: '#000',
            textTransform: 'capitalize',
            borderRadius: '4px',
            mt: 2
          }}
          onClick={onAddAccount}
        >
          Add Wallet
        </Button>
      </Stack>
    </Modal>
  )
}

import { Button, InputBase, Modal, Stack, Typography } from '@mui/material'
import NetworkSelection from '../Selection/NetworkSelection'
import { Account, Network, Token, Wallet } from '../../types'
import AccountSelection from '../Selection/AccountSelection'
import TokenSelection from '../Selection/TokenSelection'
import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { da } from 'zod/v4/locales'

interface DepositModalProps {
  open: boolean
  onClose: () => void
  loading?: boolean
  error: string | null
  onConfirm?: (
    wallet: Wallet,
    asset: string,
    amount: string,
    chainId: number
  ) => void
}

export const DepositModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  error = null
}: DepositModalProps) => {
  const [data, setData] = useState<{
    account?: Wallet
    token?: Token
    amount: string
    network?: Network
  }>({
    account: undefined,
    token: undefined,
    amount: '',
    network: undefined
  })
  const [balance, setBalance] = useState<string>('0')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { getBalance } = useTokenBalance()

  useEffect(() => {
    if (!open) {
      setData({
        account: undefined,
        token: undefined,
        amount: ''
      })
    }
  }, [open])

  useEffect(() => {
    if (!data.token || !data.account || !data.network) return
    getBalance(
      data.network.chainId,
      data.account.address,
      data.token.address
    ).then((balance) =>
      setBalance(ethers.formatUnits(balance, data.token?.decimals))
    )
  }, [data.token, data.account, data.network])

  const onChangeNetwork = (network: Network) => {
    console.log('Selected network:', network)
    setData((prev) => ({ ...prev, network }))
  }

  const onChangeAccount = (account: Wallet) => {
    console.log('Selected account:', account)
    setData((prev) => ({ ...prev, account }))
  }

  const onChangeToken = (token: Token) => {
    console.log('Selected token:', token)
    setData((prev) => ({ ...prev, token }))
  }

  const onChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === '.') {
      // Prevent starting with a dot
      setData((prev) => ({ ...prev, amount: '0.' }))
      return
    }

    // Validate that the value is numeric (including empty string and decimal numbers)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setData((prev) => ({ ...prev, amount: value }))
    }
  }

  const handleConfirm = () => {
    if (!data.account || !data.token || !data.amount || !data.network) {
      console.error('Missing required data for deposit')
      return
    }
    if (!onConfirm) return
    onConfirm(
      data.account,
      data.token.address,
      ethers.parseUnits(data.amount, data.token.decimals).toString(),
      data.network.chainId
    )
  }

  const btnDisabled =
    !data.account ||
    !data.token ||
    !data.amount ||
    loading ||
    Number(data.amount) === 0 ||
    Number(data.amount) > Number(balance) ||
    error !== null

  useEffect(() => {
    if (Number(data.amount) > Number(balance)) {
      setErrorMessage('Insufficient balance')
    } else {
      setErrorMessage(null)
    }
  }, [data.amount, balance])

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
          width: 600,
          minHeight: 200,
          background: '#1E2128',
          borderRadius: '20px',
          p: 4,
          outline: 'none'
        }}
      >
        <Typography
          variant='h5'
          color='#F3F4F6'
        >
          Deposit Preview
        </Typography>

        <Typography
          variant='body1'
          color='#BDC1CA'
        >
          Specify the asset and amount for your transaction.
        </Typography>

        <AccountSelection
          selectedAccount={data.account}
          onAccountChange={onChangeAccount}
          fullWidth
          buttonSx={{
            mt: 2,
            borderRadius: '10px',
            background: '#323743'
          }}
        />
        <NetworkSelection
          selectedNetwork={data.network}
          onNetworkChange={onChangeNetwork}
          fullWidth
          buttonSx={{
            mt: 2,
            borderRadius: '10px',
            background: '#323743'
          }}
        />

        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          spacing={2}
          mt={2}
        >
          <TokenSelection
            selectedToken={data.token}
            onTokenChange={onChangeToken}
            buttonSx={{
              borderRadius: '10px',
              background: '#323743'
            }}
            sx={{ flex: 1 }}
          />

          <InputBase
            value={data.amount}
            onChange={onChangeAmount}
            placeholder='Enter amount'
            sx={{
              flex: 1,
              p: '6px 16px',
              borderRadius: '10px',
              background: '#323743',
              color: '#F3F4F6'
            }}
            inputProps={{
              style: { padding: 0 }
            }}
          />
        </Stack>

        {balance && data.token && (
          <Typography
            variant='body2'
            color='#BDC1CA'
            sx={{ mt: 1, alignSelf: 'flex-end' }}
          >
            Balance: {balance} {data.token.symbol}
          </Typography>
        )}

        {error && (
          <Typography
            color='error'
            variant='body2'
            sx={{ mt: 2 }}
          >
            {error}
          </Typography>
        )}

        {errorMessage && (
          <Typography
            color='error'
            variant='body2'
            sx={{ mt: 2 }}
          >
            {errorMessage}
          </Typography>
        )}

        <Button
          variant='contained'
          sx={{
            background: '#68EB8E',
            color: '#000',
            textTransform: 'capitalize',
            borderRadius: '8px',
            mt: 5,
            '& .MuiCircularProgress-root': {
              color: '#68EB8E'
            }
          }}
          disabled={btnDisabled}
          onClick={handleConfirm}
          loading={loading}
        >
          Confirm
        </Button>
        <Button
          variant='outlined'
          sx={{
            border: '1px solid #68EB8E',
            color: '#68EB8E',
            textTransform: 'capitalize',
            borderRadius: '8px',
            mt: 1
          }}
          onClick={onClose}
        >
          Close
        </Button>
      </Stack>
    </Modal>
  )
}

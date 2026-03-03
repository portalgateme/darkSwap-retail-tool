import {
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import { useState } from 'react'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import {
  CreateAutoOrderFormData,
  PriceType,
  Wallet
} from '../../types'
import AccountSelection from '../Selection/AccountSelection'
import { AssetPairSelection } from '../Selection/AssetPairSelection'
import NetworkSelection from '../Selection/NetworkSelection'
import { OrderDirectionSelection } from '../Selection/OrderDirectionSelection'

interface CreateAutoOrderFormProps {
  formData: CreateAutoOrderFormData
  onChangeData: (data: Partial<CreateAutoOrderFormData>) => void
  selectedWallet?: Wallet
  onChangeWallet: (wallet: Wallet) => void
}

export const CreateAutoOrderForm: React.FC<CreateAutoOrderFormProps> = ({
  formData,
  onChangeData,
  selectedWallet,
  onChangeWallet
}) => {
  const [priceType, setPriceType] = useState<PriceType>(PriceType.MARKET)
  const { currentChain, onChangeChain } = useChainContext()

  const onChangeNumberData = (
    field: keyof CreateAutoOrderFormData,
    value: string
  ) => {
    const regex = /^\d*\.?\d*$/

    // User input '.' should be treated as '0.'
    if (value === '.') {
      onChangeData({ [field]: '0.' })
      return
    }

    if (value === '' || regex.test(value)) {
      onChangeData({ [field]: value })
    }
  }

  const onChangeDateData = (
    field: keyof CreateAutoOrderFormData,
    value: string
  ) => {
    console.log('Input date value:', value)
    const timestamp = Date.parse(value)
    if (Number.isNaN(timestamp)) {
      onChangeData({ [field]: '' })
      return
    }
    onChangeData({ [field]: timestamp.toString() })
  }

  const validatePrice = (price: string): string | null => {
    if (!price) return 'Price is required'
    return null
  }

  const validateAmount = (amount: string): string | null => {
    if (!amount) return 'Amount is required'
    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      return 'Amount must be greater than 0'
    }
    return null
  }

  const validateInterval = (interval: string): string | null => {
    if (!interval) return 'Interval is required'
    const intervalNum = parseInt(interval)
    if (intervalNum <= 0) {
      return 'Interval must be greater than 0'
    }
    return null
  }

  const validateDates = (startAt: string, endAt: string): string | null => {
    if (!startAt) return null
    if (!endAt) return null
    const startNum = parseInt(startAt)
    const endNum = parseInt(endAt)
    if (endNum <= startNum) {
      return 'End Date must be after Start Date'
    }
    return null
  }

  return (
    <Stack
      spacing={2}
      sx={{
        padding: 2,
        borderRadius: '16px'
      }}
    >
      <Stack
        direction='row'
        spacing={2}
        flexWrap='wrap'
        alignItems={'center'}
      >
        <NetworkSelection
          selectedNetwork={currentChain}
          onNetworkChange={onChangeChain}
          buttonSx={{ border: '1px solid #3A3E47' }}
        />
        <AccountSelection
          selectedAccount={selectedWallet}
          onAccountChange={(account) => onChangeWallet(account)}
          buttonSx={{ border: '1px solid #3A3E47' }}
        />
        <AssetPairSelection />
        <OrderDirectionSelection
          orderDirection={formData.orderDirection}
          onChangeOrderDirection={(direction) =>
            onChangeData({ orderDirection: direction })
          }
        />
      </Stack>

      {/* <Stack
        direction='row'
        gap={2}
        flexWrap='wrap'
        alignItems={'center'}
      > */}
      {/* <Select
          value={formData.orderType}
          onChange={(e) =>
            onChangeData({
              orderType: Number(e.target.value)
            })
          }
          sx={{
            minWidth: 160,
            background: '#262A33',
            color: '#F3F4F6',
            borderRadius: '8px'
          }}
          size='small'
          readOnly
        >
          <MenuItem value={OrderType.LIMIT}>Limit</MenuItem>
          <MenuItem value={OrderType.MARKET}>Market</MenuItem>
        </Select> */}

      {/* TODO: Hide until next decision */}
      {/* <TextField
          label='Fee Ratio'
          value={formData.feeRatio}
          onChange={(e) =>
            onChangeData({
              feeRatio: e.target.value
            })
          }
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, minWidth: 160 }}
        /> */}
      {/* </Stack> */}

      <Stack
        direction='row'
        spacing={2}
        flexWrap='wrap'
      >
      </Stack>

      <Stack
        direction='row'
        spacing={2}
        flexWrap='wrap'
      >
        <Select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value as PriceType)}
          displayEmpty
          sx={{
            minWidth: 160,
            // background: '#262A33',
            color: '#F3F4F6',
            borderRadius: '8px'
          }}
          size='small'
          MenuProps={{
            PaperProps: {
              sx: {
                background: '#1E2128',
                color: '#F3F4F6'
              }
            }
          }}
          color='success'
        >
          <MenuItem value={PriceType.LIMIT}>Use Fixed Price</MenuItem>
          <MenuItem value={PriceType.MARKET}>Use Market Price</MenuItem>
        </Select>

        <TextField
          label={
            priceType === PriceType.LIMIT
              ? 'Price'
              : `Use realtime price from binance`
          }
          value={priceType === PriceType.LIMIT ? formData.price : ''}
          disabled={priceType === PriceType.MARKET}
          error={!!validatePrice(formData.price)}
          helperText={validatePrice(formData.price)}
          focused={priceType === PriceType.LIMIT}
          size='small'
          required={priceType === PriceType.LIMIT}
          onChange={(e) => {
            onChangeNumberData('price', e.target.value)
          }}
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, width: 300 }}
          color='success'
        />
      </Stack>

      <Stack
        direction='row'
        spacing={10}
        flexWrap='wrap'
        alignItems={'flex-start'}
      >
        <TextField
          label='Amount'
          required
          value={formData.amountOut}
          onChange={(e) => {
            onChangeNumberData('amountOut', e.target.value)
          }}
          error={!!validateAmount(formData.amountOut)}
          helperText={validateAmount(formData.amountOut)}
          size='small'
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, minWidth: 300 }}
          color='success'
        />

        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
        >
          <Typography color='#BDC1CA'>Max orders per day</Typography>
          <Select
            value={formData.maxOrdersPerDay}
            onChange={(e) =>
              onChangeNumberData('maxOrdersPerDay', e.target.value)
            }
            displayEmpty
            sx={{
              minWidth: 160,

              height: 40,
              // background: '#262A33',
              color: '#F3F4F6',
              borderRadius: '8px'
            }}
            size='small'
            color='success'
            MenuProps={{
              PaperProps: {
                sx: {
                  background: '#1E2128',
                  color: '#F3F4F6'
                }
              }
            }}
          >
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={8}>8</MenuItem>
            <MenuItem value={16}>16</MenuItem>
            <MenuItem value={32}>32</MenuItem>
            <MenuItem value={64}>64</MenuItem>
            <MenuItem value={128}>128</MenuItem>
          </Select>
        </Stack>
      </Stack>

      <Stack
        direction='row'
        spacing={2}
        flexWrap='wrap'
      >
        <TextField
          label='Start Date'
          type='datetime-local'
          // value={startDate}
          onChange={(e) => {
            onChangeDateData('startAt', e.target.value)
          }}
          size='small'
          InputLabelProps={{
            shrink: true,
            style: { color: '#BDC1CA' }
          }}
          sx={{ input: { color: '#F3F4F6' }, minWidth: 240 }}
          color='success'
        />
        <TextField
          label='End Date'
          type='datetime-local'
          // value={endDate}
          onChange={(e) => {
            onChangeDateData('endAt', e.target.value)
          }}
          error={!!validateDates(formData.startAt, formData.endAt)}
          helperText={validateDates(formData.startAt, formData.endAt)}
          size='small'
          InputLabelProps={{
            shrink: true,
            style: { color: '#BDC1CA' }
          }}
          sx={{ input: { color: '#F3F4F6' }, minWidth: 240 }}
          color='success'
        />
        <TextField
          label='Interval (seconds)'
          value={formData.intervalSeconds}
          onChange={(e) => {
            onChangeNumberData('intervalSeconds', e.target.value)
          }}
          error={!!validateInterval(formData.intervalSeconds)}
          helperText={validateInterval(formData.intervalSeconds)}
          size='small'
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, minWidth: 180 }}
          color='success'
        />
      </Stack>
    </Stack>
  )
}

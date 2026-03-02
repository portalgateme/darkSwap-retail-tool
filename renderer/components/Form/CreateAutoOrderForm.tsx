import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import NetworkSelection from '../Selection/NetworkSelection'
import AccountSelection from '../Selection/AccountSelection'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import {
  CreateAutoOrderFormData,
  OrderDirection,
  OrderType,
  Wallet
} from '../../types'
import { AssetPairSelection } from '../Selection/AssetPairSelection'
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
  const { currentChain, onChangeChain } = useChainContext()
  const {
    list,
    assetPair: selectedPair,
    onChangeAssetPair
  } = useAssetPairContext()

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

  // Add validation helper functions
  const validateMinMax = (min: string, max: string): string | null => {
    if (!min || !max) return null
    const minNum = parseFloat(min)
    const maxNum = parseFloat(max)
    if (minNum >= maxNum) {
      return 'Min Price must be less than Max Price'
    }
    return null
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
        <TextField
          label='Min Price'
          value={formData.minPrice}
          onChange={(e) => {
            onChangeNumberData('minPrice', e.target.value)
          }}
          error={!!validateMinMax(formData.minPrice, formData.maxPrice)}
          helperText={validateMinMax(formData.minPrice, formData.maxPrice)}
          size='small'
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, width: 300 }}
          color='success'
        />
        <TextField
          label='Max Price'
          value={formData.maxPrice}
          onChange={(e) => {
            onChangeNumberData('maxPrice', e.target.value)
          }}
          error={!!validateMinMax(formData.minPrice, formData.maxPrice)}
          helperText={validateMinMax(formData.minPrice, formData.maxPrice)}
          size='small'
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, width: 300 }}
          color='success'
        />
      </Stack>

      <Stack
        direction='row'
        spacing={2}
        flexWrap='wrap'
      >
        <TextField
          label='Price'
          value={formData.price}
          disabled={formData.orderType === OrderType.MARKET}
          error={!!validatePrice(formData.price)}
          helperText={validatePrice(formData.price)}
          size='small'
          required
          onChange={(e) => {
            onChangeNumberData('price', e.target.value)
          }}
          InputLabelProps={{ style: { color: '#BDC1CA' } }}
          sx={{ input: { color: '#F3F4F6' }, width: 300 }}
          color='success'
        />

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

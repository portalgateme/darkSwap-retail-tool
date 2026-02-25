import { Button, InputBase, Stack, Typography } from '@mui/material'
import NetworkSelection from '../Selection/NetworkSelection'
import { useEffect, useMemo, useState } from 'react'
import {
  AssetPairDto,
  Network,
  OrderDirection,
  OrderDto,
  OrderType,
  StpMode,
  TimeInForce,
  Token
} from '../../types'
import { LabelAssetAmountInput } from '../Input/LabelAssetAmountInput'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import { IOSSwitchButton } from '../Button/IOSSwitchButton'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { getMarketPriceFromBinance } from '../../services/orderService'
import { ethers } from 'ethers'
import { safeAmountWithDecimals } from '../../utils/safeAmount'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { useToast } from '../../contexts/ToastContext'
import { useGetAssets } from '../../hooks/useGetAssets'

interface LimitOrderFormProps {
  onClose: () => void
}

export const LimitOrderForm: React.FC<LimitOrderFormProps> = ({ onClose }) => {
  const { chainId, currentChain, onChangeChain } = useChainContext()
  const { selectedAccount } = useAccountContext()
  const { assetPair } = useAssetPairContext()
  const { hideToast, showLoading, showSuccess, showError } = useToast()
  const { listData, fetchAssets } = useGetAssets()

  const [formData, setFormData] = useState<{
    amountIn: string
    amountOut: string
    price: string
    assetIn: Token | undefined
    assetOut: Token | undefined
    useMarketPrice: boolean
    orderDirection: OrderDirection
  }>({
    amountIn: '',
    amountOut: '',
    price: '',
    assetIn: undefined,
    assetOut: undefined,
    useMarketPrice: false,
    orderDirection: OrderDirection.SELL
  })
  const [marketPrice, setMarketPrice] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!chainId || !selectedAccount) return
    fetchAssets(chainId, selectedAccount.address)
  }, [selectedAccount, chainId])

  const balanceTokenOut = useMemo(() => {
    if (!formData.assetOut || !listData) return '0'
    const asset = listData.assets.find(
      (asset) =>
        asset.asset.toLowerCase() === formData.assetOut!.address.toLowerCase()
    )
    return asset
      ? ethers.formatUnits(asset.amount, formData.assetOut.decimals)
      : '0'
  }, [formData.assetOut, listData])

  const fetchMarketPrice = async (assetPair: AssetPairDto) => {
    const price = await getMarketPriceFromBinance(
      assetPair.baseSymbol + assetPair.quoteSymbol
    )
    setFormData((prev) => ({
      ...prev,
      price: parseFloat(price).toFixed(2)
    }))
    setMarketPrice(parseFloat(price).toFixed(2))
  }

  useEffect(() => {
    if (!assetPair) return
    setFormData((prev) => ({
      ...prev,
      assetIn: {
        address: assetPair.quoteAddress,
        decimals: assetPair.quoteDecimal,
        symbol: assetPair.quoteSymbol
      },
      assetOut: {
        address: assetPair.baseAddress,
        decimals: assetPair.baseDecimal,
        symbol: assetPair.baseSymbol
      },
      orderDirection: OrderDirection.SELL
    }))
  }, [assetPair])

  useEffect(() => {
    if (!assetPair) return
    fetchMarketPrice(assetPair)
  }, [assetPair])

  useEffect(() => {
    // Reset error
    if (!formData.amountOut) {
      setFormData((prev) => ({
        ...prev,
        amountIn: ''
      }))
      return
    }

    // Check amount and balance
    const balance = parseFloat(balanceTokenOut)
    const amountOut = parseFloat(formData.amountOut)
    if (amountOut > balance) {
      setError('Insufficient balance for the selected asset.')
      return
    } else {
      setError(null)
    }

    // Calculate amountIn
    if (formData.amountOut && formData.price && formData.assetIn) {
      const amountIn = safeAmountWithDecimals(
        (formData.orderDirection === OrderDirection.SELL
          ? parseFloat(formData.amountOut) * parseFloat(formData.price)
          : parseFloat(formData.amountOut) / parseFloat(formData.price)
        ).toString(),
        formData.assetIn.decimals
      )
      setFormData((prev) => ({
        ...prev,
        amountIn
      }))
    }
  }, [formData.amountOut, formData.price, formData.assetIn])

  const handleClose = () => {
    // Reset form data if needed
    setFormData({
      amountIn: '',
      amountOut: '',
      price: '',
      assetIn: undefined,
      assetOut: undefined,
      useMarketPrice: false,
      orderDirection: OrderDirection.SELL
    })
    onClose()
  }

  const onPlaceOrder = async () => {
    if (
      !selectedAccount ||
      !chainId ||
      !assetPair ||
      !formData.assetIn ||
      !formData.assetOut
    )
      return
    setLoading(true)
    const toastId = showLoading('Placing order...')
    try {
      const amountInBN = ethers
        .parseUnits(formData.amountIn, formData.assetIn.decimals)
        .toString()
      const amountOutBN = ethers
        .parseUnits(formData.amountOut, formData.assetOut.decimals)
        .toString()
      const partialAmountInBN = (
        ethers.parseUnits(formData.amountIn, formData.assetIn.decimals) /
        BigInt(100)
      ).toString() // 1% of amountIn

      const params: OrderDto = {
        orderId: crypto.randomUUID(),
        wallet: selectedAccount.address,
        chainId: chainId,
        assetPairId: assetPair.id,
        orderDirection: formData.orderDirection,
        orderType: formData.useMarketPrice ? OrderType.MARKET : OrderType.LIMIT,
        timeInForce: TimeInForce.GTC,
        stpMode: StpMode.NONE,
        price: formData.price,
        amountOut: amountOutBN,
        amountIn: amountInBN,
        partialAmountIn: partialAmountInBN,
        feeRatio: '0.001'
      }

      console.log('Placing order with params:', params)
      // @ts-ignore
      await window.orderAPI.createOrder(params)
      handleClose()
      hideToast(toastId)
      showSuccess('Order placed successfully!')
    } catch (error) {
      console.error('Error placing order:', error)
      hideToast(toastId)
      showError('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchAsset = () => {
    setFormData((prev) => ({
      ...prev,
      assetIn: prev.assetOut,
      assetOut: prev.assetIn,
      orderDirection:
        prev.orderDirection === OrderDirection.BUY
          ? OrderDirection.SELL
          : OrderDirection.BUY,
      amountIn: '',
      amountOut: ''
    }))
  }

  const btnDisabled =
    !formData.amountOut || !formData.price || loading || !!error

  const onCheckUseMarketPrice = (checked: boolean) => {
    setFormData({
      ...formData,
      useMarketPrice: checked
    })
    if (checked && assetPair) {
      fetchMarketPrice(assetPair)
    }
  }

  const onChangeLimitPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validate input to allow only numbers and decimal point
    const value = e.target.value
    const regex = /^\d*\.?\d*$/

    // User input '.' should be treated as '0.'
    if (value === '.') {
      setFormData({ ...formData, price: '0.' })
      return
    }

    if (value === '' || regex.test(value)) {
      setFormData({ ...formData, price: value })
    }
  }

  return (
    <Stack>
      <NetworkSelection
        selectedNetwork={currentChain}
        onNetworkChange={onChangeChain}
        buttonSx={{
          border: '1px solid #3A3E47'
        }}
        fullWidth
      />

      <Stack
        direction='row'
        alignItems={'center'}
        justifyContent={'space-between'}
        spacing={4}
        sx={{
          background: '#262A33',
          borderRadius: '8px',
          p: '4px 12px',
          mb: 2,
          mt: 2,
          border: '1px solid #3A3E47'
        }}
      >
        <Typography color='#F3F4F6B8'>Limit Price</Typography>
        <Stack
          flex={1}
          direction={'row'}
          spacing={1}
          alignItems='center'
        >
          <InputBase
            value={formData.price}
            onChange={onChangeLimitPrice}
            // text right to left for input
            sx={{
              color: '#F3F4F6B8',
              direction: 'rtl',
              width: '100%'
            }}
          />
          <Typography color='#F3F4F6B8'>
            {assetPair ? assetPair.quoteSymbol : ''}/
            {assetPair ? assetPair.baseSymbol : ''}
          </Typography>
        </Stack>
      </Stack>

      <LabelAssetAmountInput
        label='You sell'
        token={formData.assetOut?.address}
        amount={formData.amountOut}
        onChange={(amount) =>
          setFormData((prev) => ({
            ...prev,
            amountOut: amount
          }))
        }
      />

      <Stack
        width={'100%'}
        alignItems='center'
        justifyContent={'center'}
        sx={{ mt: 2, mb: 2 }}
      >
        <SwapVertIcon
          sx={{
            color: '#F3F4F6B8',
            p: 0.5,
            border: '1px solid #3A3E47',
            borderRadius: '50%',
            cursor: 'pointer',
            ':hover': { background: '#3A3E47' }
          }}
          onClick={switchAsset}
        />
      </Stack>

      <LabelAssetAmountInput
        label='You buy'
        token={formData.assetIn?.address}
        amount={formData.amountIn}
      />

      <Stack
        mt={2}
        spacing={1}
      >
        <IOSSwitchButton
          checked={formData.useMarketPrice}
          onChange={() => onCheckUseMarketPrice(!formData.useMarketPrice)}
          label='Use Market Price'
        />

        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            Rate
          </Typography>
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            1 {assetPair?.baseSymbol} = {marketPrice} {assetPair?.quoteSymbol}
          </Typography>
        </Stack>
        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            Service Fee
          </Typography>
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            1 USDC
          </Typography>
        </Stack>
        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            Time in Force
          </Typography>
          <Typography
            variant='body1'
            color='#BDC1CA'
          >
            Good Till Cancelled
          </Typography>
        </Stack>
      </Stack>

      {error && (
        <Typography
          color='#FF4D4F'
          variant='body2'
          sx={{ mt: 2 }}
        >
          {error}
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
        onClick={onPlaceOrder}
        disabled={btnDisabled}
        loading={loading}
      >
        Create Order
      </Button>
    </Stack>
  )
}

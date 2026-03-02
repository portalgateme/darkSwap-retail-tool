import {
  Box,
  Button,
  FormControl,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { use, useEffect, useState } from 'react'
import { PlaceOrderModal } from '../Modal/PlaceOrderModal'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { OrderStatusLabel } from '../Label/OrderStatusLabel'
import {
  OrderDirection,
  OrderDto,
  OrderEvents,
  OrderStatus,
  OrderType,
  SortType
} from '../../types'

import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { ethers } from 'ethers'
import { NetworkLabel } from '../Label/NetworkLabel'
import { useConfigContext } from '../../contexts/ConfigContext/hooks'
import { useToast } from '../../contexts/ToastContext'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline'
import { WarningAlert } from '../Alert'
import { useTransactionContext } from '../../contexts/TransactionContext/hooks'

const orderType = (type: OrderType) => {
  switch (type) {
    case OrderType.LIMIT:
      return 'Limit'
    case OrderType.MARKET:
      return 'Market'
    case OrderType.STOP_LOSS_LIMIT:
      return 'Stop Loss Limit'
    case OrderType.TAKE_PROFIT_LIMIT:
      return 'Take Profit Limit'
    case OrderType.STOP_LOSS:
      return 'Stop Loss'
    case OrderType.TAKE_PROFIT:
      return 'Take Profit'
    default:
      return 'Unknown'
  }
}

export const OrderContent = () => {
  const [openModal, setOpenModal] = React.useState(false)
  const [listData, setListData] = useState<OrderEvents[]>([])
  const { list } = useAssetPairContext()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5
  })

  const { chainId } = useChainContext()
  const { hideToast, showLoading, showSuccess, showError } = useToast()
  const [search, setSearch] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [sort, setSort] = useState<SortType>(SortType.NEWEST)
  const [copied, setCopied] = useState<string>('')
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const { loading, startLoad, stopLoad, txExecuting } = useTransactionContext()

  useEffect(() => {
    if (copied !== '') {
      const timer = setTimeout(() => {
        setCopied('')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
  }

  const onOpenModal = () => {
    setOpenModal(true)
  }

  const onCloseModal = () => {
    if (!chainId) return
    fetchOrders(
      chainId,
      pagination.page,
      pagination.limit,
      sort,
      filterStatus === 'all' ? undefined : filterStatus,
      search.trim() === '' ? undefined : search.trim()
    )
    setOpenModal(false)
  }

  const fetchOrders = async (
    chainId: number,
    page: number,
    limit: number,
    sort: SortType,
    status?: OrderStatus,
    search?: string
  ) => {
    // @ts-ignore
    const result = await window.orderAPI.getAllOrders(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
    console.log('Fetched orders:', result)
    setListData(result.orders)
    setTotalOrders(result.total)
  }

  useEffect(() => {
    if (!chainId) return
    const status = filterStatus === 'all' ? undefined : filterStatus
    const searchTerm = search.trim() === '' ? undefined : search.trim()
    fetchOrders(
      chainId,
      pagination.page,
      pagination.limit,
      sort,
      status,
      searchTerm
    )
  }, [chainId, pagination.page, pagination.limit, sort, filterStatus, search])

  const formatAmountOut = (row: OrderDto) => {
    const assetPair = list.find((ap) => ap.id === row.assetPairId)
    if (!assetPair) return row.amountOut.toString()

    const decimalOut =
      row.orderDirection === OrderDirection.SELL
        ? assetPair.baseDecimal
        : assetPair.quoteDecimal
    const result = ethers.formatUnits(row.amountOut, decimalOut)
    return result
  }

  const formatAmountIn = (row: OrderDto) => {
    const assetPair = list.find((ap) => ap.id === row.assetPairId)
    if (!assetPair) return row.amountIn.toString()

    const decimalIn =
      row.orderDirection === OrderDirection.SELL
        ? assetPair.quoteDecimal
        : assetPair.baseDecimal
    const result = ethers.formatUnits(row.amountIn, decimalIn)
    return result
  }

  const handlePageChange = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    value: number
  ) => {
    console.log('Page changed to:', value)
    setPagination((prev) => ({ ...prev, page: value + 1 }))
  }

  console.log('Rendering OrderContent with listData:', pagination, listData)

  const listStatuses = new Array<OrderStatus>(
    OrderStatus.OPEN,
    OrderStatus.MATCHED,
    OrderStatus.CANCELLED,
    OrderStatus.SETTLED,
    OrderStatus.NOT_TRIGGERED,
    OrderStatus.TRIGGERED,
    OrderStatus.BOB_CONFIRMED
  )

  const onCancelOrder = async (order: OrderEvents) => {
    const toastId = showLoading('Cancelling order...')
    try {
      startLoad(order.orderId)
      // @ts-ignore
      await window.orderAPI.cancelOrder({
        chainId: order.chainId,
        wallet: order.wallet,
        orderId: order.orderId
      })
      await fetchOrders(
        order.chainId,
        pagination.page,
        pagination.limit,
        sort,
        filterStatus === 'all' ? undefined : filterStatus,
        search.trim() === '' ? undefined : search.trim()
      )
      hideToast(toastId)
      showSuccess('Order cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling order:', error)
      hideToast(toastId)
      showError('Failed to cancel order. Please try again.')
    } finally {
      stopLoad()
    }
  }

  const isCancelable = (status?: OrderStatus) => {
    if (status === undefined) return false
    return status === OrderStatus.OPEN || status === OrderStatus.NOT_TRIGGERED
  }

  return (
    <Stack mt={2}>
      <Box mb={2}>
        <WarningAlert
          title='Notice'
          text='Please keep the desktop open while your order is Open. The order will be Settled once matched'
        />
      </Box>
      {/* Actions */}
      <Stack
        width={'100%'}
        direction={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        <Stack
          direction='row'
          spacing={2}
        >
          <TextField
            placeholder='Search by Order ID...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size='small'
            sx={{
              width: '300px',
              background: '#1E2128',
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none'
                },
                '&:hover fieldset': {
                  border: 'none'
                },
                '&.Mui-focused fieldset': {
                  border: 'none'
                }
              }
            }}
            slotProps={{
              input: {
                sx: {
                  color: '#FFFFFF'
                }
              }
            }}
          />
          {/* Filter by Status */}
          {/* <FormControl
            size='small'
            sx={{ minWidth: 150 }}
          >
            <Select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as OrderStatus | 'all')
              }
              sx={{
                background: '#1E2128',
                color: '#FFFFFF',
                borderRadius: '8px',
                height: '40px',
                '& .MuiSelect-select': {
                  padding: '0px 14px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1E2128',
                    '& .MuiMenuItem-root': {
                      color: '#FFFFFF'
                    }
                  }
                }
              }}
            >
              <MenuItem value='all'>All Status</MenuItem>
              {listStatuses.map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                >
                  <OrderStatusLabel status={status} />
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          <FormControl
            size='small'
            sx={{ minWidth: 150 }}
          >
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              sx={{
                background: '#1E2128',
                color: '#FFFFFF',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1E2128',
                    '& .MuiMenuItem-root': {
                      color: '#FFFFFF'
                    }
                  }
                }
              }}
            >
              <MenuItem value={SortType.NEWEST}>Newest First</MenuItem>
              <MenuItem value={SortType.OLDEST}>Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* <Button
          variant='contained'
          sx={{
            background: '#68EB8E',
            color: '#0A0A0A',
            textTransform: 'capitalize',
            borderRadius: '10px',
            height: '40px'
          }}
          startIcon={<AddIcon />}
          onClick={onOpenModal}
          disabled={!!loading}
        >
          Place Order
        </Button> */}
      </Stack>
      {/* Table */}
      <TableContainer
        sx={{
          background: '#1E2128',
          borderRadius: '10px',
          mt: 2,
          maxHeight: '640px',
          overflowY: 'auto'
        }}
      >
        <Table>
          {/* Table Head */}
          <TableHead>
            <TableRow
              sx={{
                'tr, th, td': {
                  border: 'none',
                  color: '#68EB8E',
                  fontSize: '14px',
                  fontWeight: 700
                }
              }}
            >
              <TableCell>Id</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Pair Id</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align='center'>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
              {/* <TableCell>Network</TableCell> */}
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          {/* Table Body */}
          <TableBody>
            {listData.length > 0 ? (
              listData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{
                    'tr, th, td': {
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      paddingTop: '8px'
                    }
                  }}
                >
                  <TableCell>
                    <Stack
                      direction='row'
                      alignItems='center'
                      spacing={1}
                    >
                      <span
                        style={{
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}
                      >
                        {row.orderId}
                      </span>
                      {copied === row.orderId ? (
                        <CheckIcon
                          sx={{ fontSize: '16px', color: '#68EB8E' }}
                        />
                      ) : (
                        <Button
                          size='small'
                          onClick={() => onCopy(row.orderId)}
                          sx={{
                            minWidth: 'auto',
                            padding: '4px',
                            color: '#68EB8E'
                          }}
                        >
                          <ContentCopyIcon sx={{ fontSize: '16px' }} />
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {row.events[0] &&
                      new Date(row.events[0].createdAt)
                        .toLocaleString('en-CA', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })
                        .replace(',', '')}
                  </TableCell>
                  <TableCell>{row.assetPairId}</TableCell>
                  <TableCell>
                    {row.orderDirection === OrderDirection.BUY ? 'Buy' : 'Sell'}
                  </TableCell>
                  <TableCell align='center'>
                    {row.status != undefined && (
                      <OrderStatusLabel status={row.status} />
                    )}
                  </TableCell>

                  <TableCell>
                    <Tooltip title={formatAmountOut(row)}>
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          maximumFractionDigits: 5
                        }).format(parseFloat(formatAmountOut(row)))}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{row.price}</TableCell>
                  <TableCell>
                    {
                      <Tooltip title={formatAmountIn(row)}>
                        <span>
                          {new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 5
                          }).format(parseFloat(formatAmountIn(row)))}
                        </span>
                      </Tooltip>
                    }
                  </TableCell>
                  {/* <TableCell>
                    <NetworkLabel chainId={row.chainId} />
                  </TableCell> */}
                  <TableCell>
                    {row.events[0] && isCancelable(row.status) && (
                      <Button
                        variant='outlined'
                        color='error'
                        sx={{
                          textTransform: 'capitalize',
                          borderRadius: '8px',
                          fontSize: '12px',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 77, 77, 0.1)',
                            borderColor: '#FF4D4D'
                          },
                          '&.Mui-disabled': {
                            border: 'none'
                          },
                          '& .MuiCircularProgress-root': {
                            color: '#68EB8E'
                          }
                        }}
                        onClick={() => onCancelOrder(row)}
                        disabled={!!loading}
                        loading={loading && txExecuting === row.orderId}
                      >
                        {'Cancel'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow
                sx={{
                  'tr, th, td': {
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '14px'
                  }
                }}
              >
                <TableCell
                  colSpan={10}
                  align='center'
                  sx={{
                    color: '#FFFFFF',
                    fontSize: '14px'
                  }}
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}

            {/* Add more rows as needed */}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        mt={1}
        alignItems='center'
      >
        <TablePagination
          component='div'
          count={totalOrders}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(event) =>
            setPagination((prev) => ({
              ...prev,
              limit: parseInt(event.target.value, 10),
              page: 1
            }))
          }
          rowsPerPageOptions={[5]}
          sx={{
            color: 'white'
          }}
        />
      </Stack>
      <PlaceOrderModal
        open={openModal}
        onClose={onCloseModal}
      />
    </Stack>
  )
}

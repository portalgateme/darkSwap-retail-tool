import {
  Stack,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TablePagination,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton
} from '@mui/material'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { useEffect, useState } from 'react'
import { OrderStatusLabel } from '../Label/OrderStatusLabel'
import { NetworkLabel } from '../Label/NetworkLabel'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import {
  OrderDirection,
  OrderEventDto,
  OrderStatus,
  SortType
} from '../../types'
import { ethers } from 'ethers'
import { shorterAddress } from '../../utils/format'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SyncIcon from '@mui/icons-material/Sync'
import CheckIcon from '@mui/icons-material/Check'

const listStatuses = new Array<OrderStatus>(
  OrderStatus.OPEN,
  OrderStatus.MATCHED,
  OrderStatus.CANCELLED,
  OrderStatus.SETTLED,
  OrderStatus.NOT_TRIGGERED,
  OrderStatus.TRIGGERED,
  OrderStatus.BOB_CONFIRMED
)

export const HistoryContent = () => {
  const { chainId } = useChainContext()
  const [listData, setListData] = useState<OrderEventDto[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [search, setSearch] = useState<string>('')
  const [sort, setSort] = useState<SortType>(SortType.NEWEST)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [copied, setCopied] = useState<string>('')
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const fetchOrders = async (
    chainId: number,
    page: number,
    limit: number,
    sort: string,
    status?: number,
    search?: string
  ) => {
    // @ts-ignore
    const result = await window.orderAPI.getOrderEventsByPage(
      chainId,
      page,
      limit,
      sort,
      status,
      search
    )
    setListData(result.orderEvents)
    setTotalOrders(result.total)
  }

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

  const onSync = () => {
    if (!chainId) return
    const statusFilter = filterStatus === 'all' ? undefined : filterStatus
    const searchTerm = search.trim() === '' ? undefined : search.trim()
    fetchOrders(
      chainId,
      pagination.page,
      pagination.limit,
      sort,
      statusFilter,
      searchTerm
    )
  }

  useEffect(() => {
    if (!chainId) return
    onSync()
  }, [chainId, pagination.page, pagination.limit, sort, filterStatus, search])

  const handlePageChange = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage + 1
    }))
  }

  return (
    <Stack mt={2}>
      <Stack
        width={'100%'}
        direction={'row'}
        alignItems={'center'}
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
        <FormControl
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
        </FormControl>
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

        <IconButton
          onClick={onSync}
          disabled={loading}
          sx={{
            bgcolor: '#1E2128',
            borderRadius: '8px'
          }}
        >
          <SyncIcon
            sx={{
              cursor: loading ? 'not-allowed' : 'pointer',
              fill: '#F3F4F6',
              animation: loading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(-360deg)' }
              },
              '&:hover': { rotate: '-180deg', transition: '0.3s' }
            }}
          />
        </IconButton>
      </Stack>
      {/* Table */}
      <TableContainer
        sx={{
          background: '#1E2128',
          borderRadius: '10px',
          mt: 2
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
              <TableCell>Order Id</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Network</TableCell>
              <TableCell>Wallet</TableCell>
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
                      fontSize: '14px'
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
                          maxWidth: '200px',
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
                  <TableCell>{row.createdAt.toString()}</TableCell>
                  <TableCell>
                    <OrderStatusLabel status={row.status} />
                  </TableCell>

                  <TableCell>
                    <NetworkLabel chainId={row.chainId} />
                  </TableCell>
                  <TableCell>{shorterAddress(row.wallet)}</TableCell>
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
                  colSpan={6}
                  align='center'
                  sx={{ color: '#FFFFFF', fontSize: '14px' }}
                >
                  No order history available.
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
          rowsPerPageOptions={[5, 10]}
          sx={{
            color: 'white'
          }}
        />
      </Stack>
    </Stack>
  )
}

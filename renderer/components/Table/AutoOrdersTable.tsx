import {
  TablePagination,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Select,
  Button,
  IconButton,
  Paper,
  Box,
  Grid
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import {
  AutoOrderJobDto,
  AutoOrderJobStatus,
  OrderDirection,
  OrderType
} from '../../types'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { statusLabel } from '../AutoOrderContent'
import { Cancel, Pause, PlayArrow } from '@mui/icons-material'

interface AutoOrdersTableProps {
  jobs: AutoOrderJobDto[]
  loading: boolean

  openDetail: (job: AutoOrderJobDto) => void
  onPause: (jobId: string) => void
  onResume: (jobId: string) => void
  onCancel: (jobId: string) => void
}

export const AutoOrdersTable = ({
  jobs,
  openDetail,
  onPause,
  onResume,
  onCancel,
  loading
}: AutoOrdersTableProps) => {
  const { list } = useAssetPairContext()

  const columns: Array<{
    status: AutoOrderJobStatus
    title: string
    color: string
  }> = [
    { status: AutoOrderJobStatus.ACTIVE, title: 'Active', color: '#68EB8E' },
    { status: AutoOrderJobStatus.PAUSED, title: 'Paused', color: '#FFD666' },
    // {
    //   status: AutoOrderJobStatus.COMPLETED,
    //   title: 'Completed',
    //   color: '#91C3FF'
    // },
    {
      status: AutoOrderJobStatus.CANCELLED,
      title: 'Cancelled',
      color: '#FF7875'
    }
  ]

  const getPairLabel = (assetPairId: string) => {
    const pair = list.find((p) => p.id === assetPairId)
    return pair ? `${pair.baseSymbol}/${pair.quoteSymbol}` : assetPairId
  }

  return (
    <Grid
      container
      spacing={2}
      sx={{ overflowX: 'auto', pb: 1 }}
    >
      {columns.map((column) => {
        const columnJobs = jobs.filter((job) => job.status === column.status)
        return (
          <Grid
            key={column.status}
            spacing={1}
            size={12 / columns.length}
          >
            <Stack
              spacing={1}
              sx={{
                background: '#1E2128',
                borderRadius: '16px',
                padding: 2,
                maxHeight: '660px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                scrollbarWidth: 'none' // For Firefox
              }}
            >
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
              >
                <Typography
                  variant='subtitle1'
                  color={column.color}
                >
                  {column.title}
                </Typography>
                <Typography
                  variant='caption'
                  color='#9CA3AF'
                >
                  {columnJobs.length}
                </Typography>
              </Stack>

              {columnJobs.length === 0 ? (
                <Paper
                  variant='outlined'
                  sx={{
                    p: 2,
                    background: '#1A1D24',
                    borderColor: '#2A2E33',
                    color: '#9CA3AF'
                  }}
                >
                  {loading ? 'Loading...' : 'No jobs'}
                </Paper>
              ) : (
                columnJobs.map((job) => (
                  <Paper
                    key={job.jobId}
                    onClick={() => openDetail(job)}
                    sx={{
                      p: 2,
                      background: '#262A33',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': { background: '#2F3541' }
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography
                        variant='body2'
                        color='#F3F4F6'
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {job.jobId}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='#9CA3AF'
                      >
                        {getPairLabel(job.assetPairId)}
                      </Typography>

                      <Stack
                        direction='row'
                        spacing={1}
                        alignItems='center'
                      >
                        <Typography
                          variant='caption'
                          color='#9CA3AF'
                        >
                          {job.orderDirection === OrderDirection.BUY
                            ? 'Buy'
                            : 'Sell'}
                        </Typography>
                        <Box
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: '#6B7280'
                          }}
                        />
                        <Typography
                          variant='caption'
                          color='#9CA3AF'
                        >
                          {job.minPrice}-{job.maxPrice}
                        </Typography>
                      </Stack>

                      <Stack
                        direction='row'
                        spacing={1}
                        alignItems='center'
                      >
                        <Typography
                          variant='caption'
                          color='#9CA3AF'
                        >
                          Amt: {job.amountOut}
                        </Typography>
                        <Box
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: '#6B7280'
                          }}
                        />
                        <Typography
                          variant='caption'
                          color='#9CA3AF'
                        >
                          {job.intervalSeconds}s
                        </Typography>
                      </Stack>
                      <Typography
                        variant='caption'
                        color='#9CA3AF'
                      >
                        Price:{' '}
                        {job.orderType === OrderType.MARKET
                          ? 'Market'
                          : job.price}
                      </Typography>

                      <Stack
                        direction='row'
                        spacing={1}
                        alignItems='center'
                      >
                        {job.status === AutoOrderJobStatus.ACTIVE && (
                          <IconButton
                            size='small'
                            aria-label='Pause'
                            onClick={(e) => {
                              e.stopPropagation()
                              onPause(job.jobId)
                            }}
                          >
                            <Pause
                              fontSize='small'
                              sx={{ fill: '#BDC1CA' }}
                            />
                          </IconButton>
                        )}
                        {job.status === AutoOrderJobStatus.PAUSED && (
                          <IconButton
                            size='small'
                            aria-label='Resume'
                            onClick={(e) => {
                              e.stopPropagation()
                              onResume(job.jobId)
                            }}
                          >
                            <PlayArrow
                              fontSize='small'
                              sx={{ fill: '#BDC1CA' }}
                            />
                          </IconButton>
                        )}
                        {job.status !== AutoOrderJobStatus.CANCELLED &&
                          job.status !== AutoOrderJobStatus.COMPLETED && (
                            <IconButton
                              size='small'
                              color='error'
                              aria-label='Cancel'
                              onClick={(e) => {
                                e.stopPropagation()
                                onCancel(job.jobId)
                              }}
                            >
                              <Cancel fontSize='small' />
                            </IconButton>
                          )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Grid>
        )
      })}
    </Grid>
  )
}

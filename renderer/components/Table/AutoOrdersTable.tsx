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
import { AutoOrderCard } from '../Card/AutoOrderCard'

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
  const columns: Array<{
    status: AutoOrderJobStatus[]
    title: string
    color: string
  }> = [
    { status: [AutoOrderJobStatus.ACTIVE], title: 'Active', color: '#68EB8E' },
    { status: [AutoOrderJobStatus.PAUSED], title: 'Paused', color: '#FFD666' },
    // {
    //   status: AutoOrderJobStatus.COMPLETED,
    //   title: 'Completed',
    //   color: '#91C3FF'
    // },
    {
      status: [AutoOrderJobStatus.CANCELLED, AutoOrderJobStatus.PRE_CANCELLED],
      title: 'Cancelled',
      color: '#FF7875'
    }
  ]

  return (
    <Grid
      container
      spacing={2}
      sx={{ overflowX: 'auto', pb: 1 }}
    >
      {columns.map((column) => {
        const columnJobs = jobs.filter((job) =>
          column.status.includes(job.status as AutoOrderJobStatus)
        )
        return (
          <Grid
            key={column.status.join(',')}
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
                  <AutoOrderCard
                    key={job.jobId}
                    job={job}
                    openDetail={openDetail}
                    onPause={onPause}
                    onResume={onResume}
                    onCancel={onCancel}
                  />
                ))
              )}
            </Stack>
          </Grid>
        )
      })}
    </Grid>
  )
}

import { Paper, Stack, Typography, Box, IconButton } from '@mui/material'
import {
  AutoOrderJobDto,
  AutoOrderJobStatus,
  OrderDirection,
  OrderType
} from '../../types'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { Cancel, Pause, PlayArrow } from '@mui/icons-material'

interface AutoOrderCardProps {
  job: AutoOrderJobDto
  openDetail: (job: AutoOrderJobDto) => void
  onPause: (jobId: string) => void
  onResume: (jobId: string) => void
  onCancel: (jobId: string) => void
}

export const AutoOrderCard = ({
  job,
  openDetail,
  onPause,
  onResume,
  onCancel
}: AutoOrderCardProps) => {
  const { list } = useAssetPairContext()

  const getPairLabel = (assetPairId: string) => {
    const pair = list.find((p) => p.id === assetPairId)
    return pair ? `${pair.baseSymbol}/${pair.quoteSymbol}` : assetPairId
  }

  const getPairUnit = (assetPairId: string) => {
    const pair = list.find((p) => p.id === assetPairId)
    return pair ? pair.quoteSymbol : ''
  }
  return (
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
          Pair: {getPairLabel(job.assetPairId)}
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
            Type: {job.orderDirection === OrderDirection.BUY ? 'Buy' : 'Sell'}
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
            Range: {job.minPrice}-{job.maxPrice} {getPairUnit(job.assetPairId)}
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
            Amount: {job.amountOut}
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
            Interval: {job.intervalSeconds}s
          </Typography>
        </Stack>
        <Typography
          variant='caption'
          color='#9CA3AF'
        >
          Price: {job.orderType === OrderType.MARKET ? 'Market' : job.price}
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
            Start: {new Date(job.startAt).toLocaleDateString()}
          </Typography>

          {job.endAt && (
            <>
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
                End: {new Date(job.endAt).toLocaleDateString()}
              </Typography>
            </>
          )}
        </Stack>

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
  )
}

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Select,
  MenuItem,
  TextField,
  Box,
  InputLabel,
  FormControl
} from '@mui/material'
import {
  AutoOrderJobDto,
  EditAutoOrderFormData,
  OrderDirection,
  OrderType
} from '../../types'
import { formatDate, statusLabel } from '../AutoOrderContent'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { isSameAddress } from '../../utils/format'

interface AutoOrderDetailModalProps {
  detailOpen: boolean
  closeDetail: () => void
  selectedJob: AutoOrderJobDto | null
  isEditable: boolean | null
  editForm: EditAutoOrderFormData
  onChangeEditForm: (data: Partial<EditAutoOrderFormData>) => void
  editMode: boolean
  onChangeEditMode: () => void
  onUpdateJob: () => void
}

export const AutoOrderDetailModal = ({
  detailOpen,
  closeDetail,
  selectedJob,
  isEditable,
  editForm,
  onChangeEditForm,
  editMode,
  onChangeEditMode,
  onUpdateJob
}: AutoOrderDetailModalProps) => {
  const { list, assetPair } = useAssetPairContext()
  const { accounts } = useAccountContext()

  const walletName =
    accounts.find((acc) => isSameAddress(acc.address, selectedJob?.wallet))
      ?.name || 'Unknown Wallet'

  return (
    <Dialog
      open={detailOpen}
      onClose={closeDetail}
      maxWidth='md'
      fullWidth
      PaperProps={{
        style: { borderRadius: 16, background: '#1E2128', color: '#F3F4F6' }
      }}
    >
      <DialogTitle>Auto Order Job Details</DialogTitle>
      <DialogContent>
        {selectedJob && (
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
          >
            <Stack spacing={1}>
              <Typography variant='body2'>
                Job ID: {selectedJob.jobId}
              </Typography>
              <Typography variant='body2'>
                Wallet: {walletName} ({selectedJob.wallet})
              </Typography>
              <Typography variant='body2'>
                Status: {statusLabel(selectedJob.status)}
              </Typography>
              <Typography variant='body2'>
                Active Order: {selectedJob.activeOrderId || '-'}
              </Typography>
              <Typography variant='body2'>
                Last Run: {formatDate(selectedJob.lastRunAt)}
              </Typography>
            </Stack>

            {!isEditable && (
              <Typography
                color='error'
                variant='body2'
              >
                Job cannot be edited while it is completed/cancelled or has an
                active order.
              </Typography>
            )}

            <Stack
              direction='row'
              gap={2}
              flexWrap='wrap'
            >
              <FormControl>
                <InputLabel
                  id='demo-customized-select-label'
                  sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' }
                  }}
                >
                  Asset Pair
                </InputLabel>
                <Select
                  labelId='demo-customized-select-label'
                  label='Asset Pair'
                  value={editForm.assetPairId}
                  onChange={(e) =>
                    onChangeEditForm({ assetPairId: e.target.value })
                  }
                  sx={{
                    minWidth: 220,
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    }
                  }}
                  readOnly
                >
                  {list.map((pair) => (
                    <MenuItem
                      key={pair.id}
                      value={pair.id}
                    >
                      {pair.baseSymbol}/{pair.quoteSymbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel
                  id='demo-customized-select-label'
                  sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}
                >
                  Order Direction
                </InputLabel>
                <Select
                  labelId='demo-customized-select-label'
                  label='Order Direction'
                  value={editForm.orderDirection}
                  onChange={(e) =>
                    onChangeEditForm({
                      orderDirection: Number(e.target.value)
                    })
                  }
                  sx={{
                    minWidth: 160,
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    }
                  }}
                  readOnly
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1E2128',
                        '& .MuiMenuItem-root': {
                          color: 'white'
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value={OrderDirection.BUY}>Buy</MenuItem>
                  <MenuItem value={OrderDirection.SELL}>Sell</MenuItem>
                </Select>
              </FormControl>
              {/* 
                <FormControl>
                  <InputLabel
                    id='demo-customized-select-label'
                    sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}
                  >
                    Order Type
                  </InputLabel>
                  <Select
                    labelId='demo-customized-select-label'
                    label='Order Type'
                    value={editForm.orderType}
                    onChange={(e) =>
                      onChangeEditForm({ orderType: Number(e.target.value) })
                    }
                    sx={{
                      minWidth: 160,
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white'
                      }
                    }}
                    readOnly={!editMode}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: '#1E2128',
                          '& .MuiMenuItem-root': {
                            color: 'white'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value={OrderType.LIMIT}>Limit</MenuItem>
                    <MenuItem value={OrderType.MARKET}>Market</MenuItem>
                  </Select>
                </FormControl> */}

              {editForm.orderType === OrderType.LIMIT && (
                <TextField
                  label='Price'
                  value={editForm.price}
                  onChange={(e) => onChangeEditForm({ price: e.target.value })}
                  inputProps={{ readOnly: !editMode }}
                  sx={{
                    input: { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    }
                  }}
                  InputLabelProps={{ style: { color: 'white' } }}
                />
              )}
              {/* <TextField
                label='Min Price'
                value={editForm.minPrice}
                onChange={(e) => onChangeEditForm({ minPrice: e.target.value })}
                inputProps={{ readOnly: !editMode }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  }
                }}
                InputLabelProps={{ style: { color: 'white' } }}
              />
              <TextField
                label='Max Price'
                value={editForm.maxPrice}
                onChange={(e) => onChangeEditForm({ maxPrice: e.target.value })}
                inputProps={{ readOnly: !editMode }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  }
                }}
                InputLabelProps={{ style: { color: 'white' } }}
              /> */}
              <TextField
                label='Amount'
                value={editForm.amountOut}
                onChange={(e) =>
                  onChangeEditForm({ amountOut: e.target.value })
                }
                inputProps={{ readOnly: !editMode }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  }
                }}
                InputLabelProps={{ style: { color: 'white' } }}
              />
              {/* <TextField
                  label='Fee Ratio'
                  value={editForm.feeRatio}
                  onChange={(e) =>
                    onChangeEditForm({ feeRatio: e.target.value })
                  }
                  inputProps={{ readOnly: !editMode }}
                  sx={{
                    input: { color: 'white' },
                    '& .MuiOutlinedInput-root': { borderColor: 'white' }
                  }}
                /> */}

              <TextField
                label='Start Date'
                type='datetime-local'
                value={editForm.startAt}
                onChange={(e) => onChangeEditForm({ startAt: e.target.value })}
                inputProps={{ readOnly: !editMode }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  }
                }}
                InputLabelProps={{ style: { color: 'white' } }}
              />
              {editForm.endAt && (
                <TextField
                  label='End Date'
                  type='datetime-local'
                  value={editForm.endAt}
                  onChange={(e) => onChangeEditForm({ endAt: e.target.value })}
                  inputProps={{ readOnly: !editMode }}
                  sx={{
                    input: { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white'
                    }
                  }}
                  InputLabelProps={{ style: { color: 'white' } }}
                />
              )}

              <TextField
                label='Interval (seconds)'
                value={editForm.intervalSeconds}
                onChange={(e) =>
                  onChangeEditForm({ intervalSeconds: e.target.value })
                }
                inputProps={{ readOnly: !editMode }}
                sx={{
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  },
                  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white'
                  }
                }}
                InputLabelProps={{ style: { color: 'white' } }}
              />
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDetail}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

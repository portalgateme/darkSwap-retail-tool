import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack
} from '@mui/material'
import { CreateAutoOrderFormData, OrderType } from '../../types'
import { CreateAutoOrderForm } from '../Form/CreateAutoOrderForm'
import { Wallet } from '../../types'

interface CreateAutoOrderModalProps {
  open: boolean
  onClose: () => void
  onCreateJob: () => void
  disabled?: boolean
  formData: CreateAutoOrderFormData
  onChangeData: (data: Partial<CreateAutoOrderFormData>) => void
  selectedWallet?: Wallet
  onChangeWallet: (wallet: Wallet) => void
}

export const CreateAutoOrderModal = ({
  open,
  onClose,
  onCreateJob,
  disabled,
  formData,
  onChangeData,
  selectedWallet,
  onChangeWallet
}: CreateAutoOrderModalProps) => {
  const handleClose = () => {
    onClose()
  }

  const btnCreateDisabled = disabled

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        style: { borderRadius: 16, background: '#1E2128' }
      }}
    >
      <DialogTitle sx={{ color: '#F3F4F6' }}>Create Auto Order Job</DialogTitle>
      <DialogContent>
        <Stack sx={{ mt: 1 }}>
          <CreateAutoOrderForm
            formData={formData}
            onChangeData={onChangeData}
            selectedWallet={selectedWallet}
            onChangeWallet={onChangeWallet}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          sx={{ background: '#68EB8E', color: '#0C1114' }}
          onClick={onCreateJob}
          disabled={btnCreateDisabled}
        >
          Create Job
        </Button>
        <Button
          variant='outlined'
          onClick={handleClose}
          sx={{
            borderColor: '#68EB8E',
            color: '#68EB8E'
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

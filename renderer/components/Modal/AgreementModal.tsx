import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel
} from '@mui/material'

const AGREEMENT_STORAGE_KEY = 'agreement-accepted'

export const AgreementModal: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const onClose = () => {
    localStorage.setItem(AGREEMENT_STORAGE_KEY, 'true')
    setOpen(false)
  }

  useEffect(() => {
    const hasAcceptedAgreement =
      window.localStorage.getItem(AGREEMENT_STORAGE_KEY) === 'true'

    setOpen(!hasAcceptedAgreement)
  }, [])

  return (
    <Dialog
      open={open}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        style: { borderRadius: 16, background: '#1E2128' }
      }}
    >
      <DialogTitle sx={{ color: '#F3F4F6' }}>Agreement</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          <Typography
            variant='body2'
            paragraph
            color='#F3F4F6'
          >
            Please read and accept our terms and conditions before proceeding.
          </Typography>
          <Box
            sx={{
              borderRadius: 1,
              p: 2,
              maxHeight: 300,
              overflow: 'auto',
              my: 2,
              bgcolor: '#2C2F36',
              color: '#F3F4F6'
            }}
          >
            <Typography variant='caption'>
              1. Please use the tool downloaded from our official GitHub. By
              using the tool, you acknowledge that you are responsible for how
              it is used and any outcomes that may result.
            </Typography>{' '}
            <br />
            <br />
            <Typography variant='caption'>
              2. To use the tool, you will need to input your private keys.
              Please ensure you keep them secure. We cannot be held responsible
              for any loss or damage that may occur.
            </Typography>
            <br />
            <br />
            <Typography variant='caption'>
              3. Your private keys are not stored on our servers. They remain
              only on your local machine, and we do not share them with any
              third parties.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                sx={{
                  color: '#68EB8E',
                  '&.Mui-checked': {
                    color: '#68EB8E'
                  }
                }}
              />
            }
            label='I agree to the terms and conditions'
            sx={{
              color: '#F3F4F6'
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant='contained'
          disabled={!agreed}
          sx={{ background: '#68EB8E', color: '#0C1114' }}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  )
}

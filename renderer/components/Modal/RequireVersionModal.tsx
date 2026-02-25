import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material'

type RequireVersionModalProps = {
  isOpen: boolean
  title?: string
  currentVersion: string
  requiredVersion: string
  downloadUrl: string
  onClose?: () => void
}

export default function RequireVersionModal({
  isOpen,
  currentVersion,
  requiredVersion,
  downloadUrl,
  onClose
}: RequireVersionModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby='require-version-title'
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle id='require-version-title'>Update required</DialogTitle>
      <DialogContent>
        <Typography
          variant='body2'
          color='text.secondary'
        >
          Your version ({currentVersion}) is no longer supported. Please update
          to version {requiredVersion} or newer to continue.
        </Typography>
      </DialogContent>
      <DialogActions>
        {onClose && (
          <Button
            onClick={onClose}
            variant='outlined'
          >
            Later
          </Button>
        )}
        <Button
          component='a'
          href={downloadUrl}
          target='_blank'
          rel='noreferrer'
          variant='contained'
        >
          Download update
        </Button>
      </DialogActions>
    </Dialog>
  )
}

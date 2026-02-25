import React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography
} from '@mui/material'

type UpdateModalProps = {
  isOpen: boolean
  currentVersion: string
  latestVersion: string
  status: 'available' | 'downloading' | 'downloaded' | 'error' | 'checking'
  progress?: number | null
  error?: string | null
  onDownload: () => void
  onInstall: () => void
  onClose?: () => void
}

export default function UpdateModal({
  isOpen,
  currentVersion,
  latestVersion,
  status,
  progress,
  error,
  onDownload,
  onInstall,
  onClose
}: UpdateModalProps) {
  const isDownloading = status === 'downloading'
  const isDownloaded = status === 'downloaded'
  const isChecking = status === 'checking'

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby='update-available-title'
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle id='update-available-title'>Update available</DialogTitle>
      <DialogContent>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ mb: 2 }}
        >
          Current version: {currentVersion} · Latest: {latestVersion}
        </Typography>

        {isChecking && (
          <Typography
            variant='body2'
            color='text.secondary'
          >
            Checking for updates...
          </Typography>
        )}

        {isDownloading && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mb: 1 }}
            >
              Downloading update
              {typeof progress === 'number' ? ` (${progress.toFixed(0)}%)` : ''}
            </Typography>
            <LinearProgress
              variant={
                typeof progress === 'number' ? 'determinate' : 'indeterminate'
              }
              value={typeof progress === 'number' ? progress : undefined}
            />
          </Box>
        )}

        {isDownloaded && (
          <Typography
            variant='body2'
            color='text.secondary'
          >
            Update downloaded. Restart to install.
          </Typography>
        )}

        {status === 'error' && (
          <Typography
            variant='body2'
            color='error'
          >
            {error || 'Update failed. Please try again.'}
          </Typography>
        )}
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

        {!isDownloaded && (
          <Button
            onClick={onDownload}
            variant='contained'
            disabled={isChecking || isDownloading}
          >
            Download update
          </Button>
        )}

        {isDownloaded && (
          <Button
            onClick={onInstall}
            variant='contained'
          >
            Install and restart
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

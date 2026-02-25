import { Alert, Snackbar, Box, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 3000,
  onClose
}) => {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, type])

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  if (type === 'loading') {
    return (
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity='info'
          icon={
            <CircularProgress
              size={20}
              sx={{ color: '#fff' }}
            />
          }
          sx={{
            minWidth: '300px',
            backgroundColor: '#1976d2',
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff'
            }
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    )
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity={type}
        variant='filled'
        sx={{
          minWidth: '300px',
          backgroundColor:
            type === 'success'
              ? '#2e7d32'
              : type === 'error'
              ? '#d32f2f'
              : type === 'warning'
              ? '#ed6c02'
              : '#0288d1'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

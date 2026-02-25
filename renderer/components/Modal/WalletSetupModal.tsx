import {
  Button,
  InputBase,
  Modal,
  Stack,
  TextareaAutosize,
  Typography
} from '@mui/material'

import { useEffect, useState } from 'react'
import { WarningAlert } from '../Alert'

interface WalletSetupModalProps {
  open: boolean
  onClose: () => void
  onConfirm?: (name: string, privateKey: string) => void
}

export const WalletSetupModal = ({
  open,
  onClose,
  onConfirm
}: WalletSetupModalProps) => {
  const [name, setName] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setError(null)
  }

  const onChangePrivateKey = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const key = e.target.value.trim()

    setPrivateKey(key)
    setError(null)
  }

  const handleConfirm = () => {
    if (!name || !privateKey) {
      setError('Please fill in all fields.')
      return
    }
    if (onConfirm) {
      // Remove 0x prefix if exists
      const key = !privateKey.startsWith('0x')
        ? privateKey
        : privateKey.slice(2)
      onConfirm(name, key)
    }
  }

  // Validate private key format (basic check)
  const isValidPrivateKey = (key: string) => {
    // If private key not start with 0x, add it
    if (!key.startsWith('0x')) {
      key = '0x' + key
    }
    // Basic check: length and hex format
    return /^0x[a-fA-F0-9]{64}$/.test(key)
  }

  const buttonDisabled =
    !name || !privateKey || !isValidPrivateKey(privateKey) || !!error

  // reset state on close
  if (!open && (name || privateKey || error)) {
    setName('')
    setPrivateKey('')
    setError(null)
  }

  const onCheckPrivateKeyExists = async (key: string) => {
    //@ts-ignore
    const isExists = await window.accountAPI.checkPrivateKeyExists(key)
    if (isExists) {
      setError('This private key or recovery phrase is already in use.')
    }
  }

  useEffect(() => {
    if (privateKey) {
      onCheckPrivateKeyExists(privateKey)
    }
  }, [privateKey])
  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Stack
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          minHeight: 400,
          background: '#1E2128',
          borderRadius: '20px',
          p: 5,
          outline: 'none'
        }}
      >
        <Typography
          variant='h4'
          color='#F3F4F6'
        >
          Wallet Setup
        </Typography>

        <Typography
          variant='h5'
          color='#F3F4F6'
          mt={4}
        >
          Name
        </Typography>

        <InputBase
          placeholder='Enter the name of wallet'
          sx={{
            background: '#2C2F33',
            color: '#F3F4F6',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            marginTop: '10px',
            outline: 'none'
          }}
          onChange={onChangeName}
          value={name}
        />

        <Typography
          variant='h5'
          color='#F3F4F6'
          mt={4}
        >
          Private Key
        </Typography>

        <TextareaAutosize
          minRows={5}
          placeholder='Enter your private key or recovery phrase...'
          style={{
            background: '#2C2F33',
            color: '#F3F4F6',
            border: 'none',
            borderRadius: '10px',
            padding: '10px',
            marginTop: '10px',
            outline: 'none'
          }}
          onChange={onChangePrivateKey}
          value={privateKey}
        />

        {/* Alert card */}
        <WarningAlert
          title='Important Security Notice:'
          text='Never share your private key or recovery phrase with anyone. This
              is the ultimate access to your funds. Store it offline and in
              multiple secure locations. Digital copies are vulnerable. Lost
              keys cannot be recovered by anyone.'
        />

        <Button
          variant='contained'
          sx={{
            background: '#68EB8E',
            color: '#000',
            textTransform: 'capitalize',
            borderRadius: '8px',
            mt: 2
          }}
          disabled={buttonDisabled}
          onClick={handleConfirm}
        >
          Save Wallet
        </Button>
        <Button
          variant='outlined'
          sx={{
            borderColor: '#68EB8E',
            color: '#68EB8E',
            textTransform: 'capitalize',
            borderRadius: '8px',
            mt: 2
          }}
          onClick={onClose}
        >
          Close
        </Button>

        {error && (
          <Typography
            variant='body2'
            color='red'
            mt={2}
          >
            {error}
          </Typography>
        )}
      </Stack>
    </Modal>
  )
}

import { VisibilityOff, Visibility } from '@mui/icons-material'
import {
  Button,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import SaveIcon from '@mui/icons-material/Save'
import { useConfigContext } from '../../contexts/ConfigContext/hooks'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { WarningAlert } from '../Alert'

export const SettingContent = () => {
  const [formConfig, setFormConfig] = useState<{ apiKey?: string }>({})
  const { apiKey, saveConfigs } = useConfigContext()
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    setFormConfig({ apiKey })
  }, [apiKey])

  const onChangeApiKey = (value: string) => {
    setFormConfig((prev) => ({ ...prev, apiKey: value }))
  }

  const onSaveChanges = async () => {
    await saveConfigs({ api_key: formConfig.apiKey || '' })
    setVerified(null)
  }

  const onDiscardChanges = () => {
    setFormConfig({ apiKey })
    setVerified(null)
  }

  const onClearApiKey = () => {
    setFormConfig((prev) => ({ ...prev, apiKey: '' }))
    setVerified(null)
  }

  const onVerifyApiKey = async () => {
    if (!formConfig.apiKey) return
    setLoading(true)
    setVerified(null)
    try {
      // @ts-ignore
      const result = await window.configAPI.healthCheck(formConfig.apiKey)
      console.log('health check result', result)
      if (result.healthy) {
        setVerified(true)
      } else {
        setVerified(false)
      }
    } catch (error) {
      console.error('Error verifying API key:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack mt={5}>
      <Stack width={600}>
        <Stack
          direction='row'
          spacing={2}
          alignItems='center'
          justifyContent={'space-between'}
        >
          <Tooltip
            title={`
            Please enter your API key. You can get it from registration page. 
            Notice: The API key is required to connect to the server.`}
            arrow
          >
            <Typography color='white'>
              Your API key{' '}
              <InfoOutlineIcon sx={{ color: 'white', fontSize: 16 }} />:
            </Typography>
          </Tooltip>

          <Stack
            direction='row'
            spacing={2}
            alignItems='center'
          >
            <Stack
              direction={'row'}
              alignItems='center'
              spacing={1}
              sx={{
                borderBottom: `1px solid ${
                  verified === null ? 'white' : verified ? '#68EB8E' : '#FF6B6B'
                }`
              }}
            >
              <InputBase
                type={showApiKey ? 'text' : 'password'}
                value={formConfig.apiKey || ''}
                onChange={(e) => onChangeApiKey(e.target.value)}
                sx={{
                  width: '300px',
                  color:
                    verified === null
                      ? 'white'
                      : verified
                      ? '#68EB8E'
                      : '#FF6B6B'
                }}
              />
              {showApiKey ? (
                <VisibilityOff
                  sx={{
                    color:
                      verified === null
                        ? 'white'
                        : verified
                        ? '#68EB8E'
                        : '#FF6B6B',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowApiKey(false)}
                />
              ) : (
                <Visibility
                  sx={{
                    color:
                      verified === null
                        ? 'white'
                        : verified
                        ? '#68EB8E'
                        : '#FF6B6B',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowApiKey(true)}
                />
              )}
            </Stack>
            {!verified ? (
              verified === null ? (
                <Button
                  size='small'
                  variant='contained'
                  sx={{
                    background: '#68EB8E',
                    color: '#0A0A0A',

                    '&.Mui-disabled': {
                      border: 'none',
                      background: 'inherit'
                    },

                    '& .MuiCircularProgress-root': {
                      color: '#68EB8E'
                    }
                  }}
                  onClick={onVerifyApiKey}
                  loading={loading}
                >
                  Verify
                </Button>
              ) : (
                <IconButton onClick={onClearApiKey}>
                  <CloseIcon sx={{ color: '#FF6B6B' }} />
                </IconButton>
              )
            ) : (
              <CheckIcon sx={{ color: '#68EB8E' }} />
            )}
          </Stack>
        </Stack>

        <WarningAlert text='Each API key is bound to one desktop app. Using the same wallet with multiple API keys on different desktops may cause errors.' />
      </Stack>
      {/* Button group */}
      <Stack
        mt={4}
        spacing={2}
        direction='row'
      >
        <Button
          variant='outlined'
          sx={{
            border: '1px solid #68EB8E',
            color: '#68EB8E'
          }}
          onClick={onDiscardChanges}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          sx={{
            background: '#68EB8E',
            color: '#0A0A0A'
          }}
          startIcon={<SaveIcon />}
          onClick={onSaveChanges}
          disabled={loading || !verified}
        >
          Save Changes
        </Button>
      </Stack>
    </Stack>
  )
}

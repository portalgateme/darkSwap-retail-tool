import { InputBase, Stack, Typography } from '@mui/material'
import { TokenLabel } from '../Label/TokenLabel'

interface LabelAssetAmountInputProps {
  label: string
  token?: string
  amount: string
  onChange?: (amount: string) => void
}
export const LabelAssetAmountInput: React.FC<LabelAssetAmountInputProps> = ({
  label,
  token,
  amount,
  onChange
}) => {
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    if (value === '.' && onChange) {
      // Prevent starting with a dot
      onChange('0.')
      return
    }

    // Validate that the value is numeric (including empty string and decimal numbers)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      if (onChange) {
        onChange(value)
      }
    }
  }
  return (
    <Stack width={'100%'}>
      <Typography color='#fff'>{label}</Typography>
      <Stack
        direction={'row'}
        spacing={1}
        alignItems='center'
        justifyContent={'space-between'}
        sx={{
          border: '1px solid #323743',
          padding: '4px 12px',
          borderRadius: '8px'
        }}
      >
        <InputBase
          value={amount}
          placeholder='0.00'
          sx={{ width: '100%', color: '#fff' }}
          onChange={handleAmountChange}
        />
        <TokenLabel token={token} />
      </Stack>
    </Stack>
  )
}

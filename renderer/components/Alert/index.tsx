import { Stack, SxProps, Typography } from '@mui/material'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

export const WarningAlert = ({
  text,
  title,
  sx
}: {
  text: string
  title?: string
  sx?: SxProps
}) => {
  return (
    <Stack
      direction={'row'}
      spacing={2}
      sx={{
        width: 'calc(100% - 16px - 16px - 2px)', // full width minus padding and border
        borderRadius: '10px',
        border: '1px solid #E0E0E0',
        background: '#0C1114',
        p: 2,
        mt: 2,
        ...sx
      }}
    >
      <WarningAmberOutlinedIcon sx={{ color: '#F3F4F6', fontSize: 20 }} />
      <Stack>
        {title && <Typography color='white'>{title}</Typography>}
        <Typography
          variant='body2'
          color='#BDC1CA'
        >
          {text}
        </Typography>
      </Stack>
    </Stack>
  )
}

import { Typography } from '@mui/material'

interface LabelProps {
  text: string
  color?: string
}

export const Label: React.FC<LabelProps> = ({ text, color }) => {
  return (
    <Typography
      sx={{ color: color || '#F3F4F6B8', fontSize: '14px', fontWeight: 500 }}
    >
      {text}
    </Typography>
  )
}

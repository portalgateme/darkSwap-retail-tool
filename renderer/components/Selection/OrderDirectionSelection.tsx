import { MenuItem, Select } from '@mui/material'
import { OrderDirection } from '../../types'

export const OrderDirectionSelection: React.FC<{
  orderDirection: OrderDirection
  onChangeOrderDirection: (direction: OrderDirection) => void
}> = ({ orderDirection, onChangeOrderDirection }) => {
  return (
    <Select
      value={orderDirection}
      onChange={(e) =>
        onChangeOrderDirection(Number(e.target.value) as OrderDirection)
      }
      sx={{
        minWidth: 120,
        // background: '#262A33',
        color: '#F3F4F6',
        borderRadius: '8px'
      }}
      size='small'
      MenuProps={{
        PaperProps: {
          sx: {
            background: '#1E2128',
            color: '#F3F4F6'
          }
        }
      }}
    >
      <MenuItem value={OrderDirection.BUY}>Buy</MenuItem>
      <MenuItem value={OrderDirection.SELL}>Sell</MenuItem>
    </Select>
  )
}

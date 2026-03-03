import { MenuItem, Select } from '@mui/material'
import { AssetPairDto } from '../../types'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'

interface AssetPairSelectionProps {}
export const AssetPairSelection: React.FC<AssetPairSelectionProps> = ({}) => {
  const {
    list,
    assetPair: selectedPair,
    onChangeAssetPair
  } = useAssetPairContext()
  return (
    <Select
      value={selectedPair?.id || ''}
      onChange={(e) => {
        const pair = list.find((p) => p.id === e.target.value)
        if (pair && onChangeAssetPair) onChangeAssetPair(pair)
      }}
      displayEmpty
      sx={{
        minWidth: 160,
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
      color='success'
    >
      {/* <MenuItem value=''>Select Asset Pair</MenuItem> */}
      {list.map((pair) => (
        <MenuItem
          key={pair.id}
          value={pair.id}
        >
          {pair.baseSymbol}/{pair.quoteSymbol}
        </MenuItem>
      ))}
    </Select>
  )
}

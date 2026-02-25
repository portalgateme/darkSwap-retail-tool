import { Typography } from '@mui/material'
import { OrderStatus } from '../../types'

interface OrderStatusProps {
  status?: OrderStatus
}

export const OrderStatusLabel = ({ status }: OrderStatusProps) => {
  switch (status) {
    case OrderStatus.OPEN:
      return (
        <Typography
          color='#919EAB'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            width: 'fit-content',
            bgcolor: 'rgba(145, 158, 171, 0.16)',
            padding: '4px 8px',
            borderRadius: '6px',
            textAlign: 'center'
          }}
        >
          Open
        </Typography>
      )
    case OrderStatus.NOT_TRIGGERED:
      return (
        <Typography
          color='#919EAB'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            width: 'fit-content',
            bgcolor: 'rgba(145, 158, 171, 0.16)',
            padding: '4px 8px',
            borderRadius: '6px',
            textAlign: 'center'
          }}
        >
          Not Triggered
        </Typography>
      )
    case OrderStatus.CANCELLED:
      return (
        <Typography
          color='#919EAB'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            width: 'fit-content',
            bgcolor: 'rgba(145, 158, 171, 0.16)',
            padding: '4px 8px',
            borderRadius: '6px',
            textAlign: 'center'
          }}
        >
          Cancelled
        </Typography>
      )
    case OrderStatus.MATCHED:
      return (
        <Typography
          color='#BBF7D0'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            padding: '4px 8px',
            width: 'fit-content',
            bgcolor: 'rgba(34, 197, 94, 0.16)',
            borderRadius: '6px'
          }}
        >
          Matched
        </Typography>
      )
    // case OrderStatus.PENDING:
    //   return (
    //     <Typography
    //       color='#FFD666'
    //       fontWeight={700}
    //       sx={{
    //         fontSize: '12px',
    //         width: 'fit-content',
    //         bgcolor: 'rgba(255, 171, 0, 0.16)',
    //         padding: '4px 8px',
    //         borderRadius: '6px',
    //         textAlign: 'center'
    //       }}
    //     >
    //       Pending
    //     </Typography>
    //   )
    case OrderStatus.SETTLED:
      return (
        <Typography
          color='#BBF7D0'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            padding: '4px 8px',
            width: 'fit-content',
            bgcolor: 'rgba(34, 197, 94, 0.16)',
            borderRadius: '6px'
          }}
        >
          Settled
        </Typography>
      )
    case OrderStatus.TRIGGERED:
      return (
        <Typography
          color='#BBF7D0'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            padding: '4px 8px',
            width: 'fit-content',
            bgcolor: 'rgba(34, 197, 94, 0.16)',
            borderRadius: '6px'
          }}
        >
          Triggered
        </Typography>
      )
    case OrderStatus.BOB_CONFIRMED:
      return (
        <Typography
          color='#BBF7D0'
          fontWeight={700}
          sx={{
            fontSize: '12px',
            padding: '4px 8px',
            width: 'fit-content',
            bgcolor: 'rgba(34, 197, 94, 0.16)',
            borderRadius: '6px'
          }}
        >
          Bob Confirmed
        </Typography>
      )

    // case OrderStatus.FINALIZED:
    //   return (
    //     <Typography
    //       color='#BBF7D0'
    //       fontWeight={700}
    //       sx={{
    //         fontSize: '12px',
    //         height: '24px',
    //         padding: '4px 8px',
    //         width: 'fit-content',
    //         bgcolor: 'rgba(34, 197, 94, 0.16)',
    //         borderRadius: '6px'
    //       }}
    //     >
    //       Finalized
    //     </Typography>
    //   )

    default:
      return 'Unknown'
  }
}

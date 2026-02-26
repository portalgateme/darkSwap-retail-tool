import { Box, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import HistoryIcon from '@mui/icons-material/History'
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion'
import CheckIcon from '@mui/icons-material/Check'
import SettingsIcon from '@mui/icons-material/Settings'
import { useState } from 'react'

const darkpoolResourceLinks = {
  testnetGuide:
    'https://testnet.thesingularity.network/?utm_source=testnet&utm_medium=link&utm_campaign=darkpool_testnetguide',

  faucet: 'https://thesingularity.network/redirect/faucet',
  pointDashboard:
    'https://app.thesingularity.network/season2?utm_source=testnetpoints&utm_medium=link&utm_campaign=points_dashboard_testnet'
}

const menus = [
  {
    title: 'Auto Orders',
    icon: <AutoAwesomeMotionIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />,
    link: '/'
  },
  {
    title: 'Order Management',
    icon: '/images/order-list.png',
    link: '/orders'
  },
  // {
  //   title: 'Auto Orders',
  //   icon: <AutoAwesomeMotionIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />,
  //   link: '/auto-orders'
  // },
  {
    title: 'Order History',
    icon: <HistoryIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />,
    link: '/history'
  }
  // {
  //   title: 'Settings',
  //   icon: <SettingsIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />,
  //   link: '/settings'
  // }
]

export const Sidebar = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const handleExternalLink = (url: string, itemKey: string) => {
    navigator.clipboard.writeText(url)
    setCopiedItem(itemKey)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  return (
    <Stack
      justifyContent={'space-between'}
      sx={{
        width: 300,
        bgcolor: '#0C1114',
        height: 'calc(100vh - 32px)', // Adjusted height to fit within viewport minus padding
        padding: 2
      }}
    >
      <Stack
        sx={{
          height: '100%'
        }}
      >
        <Box
          width={200}
          height={40}
          position='relative'
          marginBottom={4}
        >
          <Image
            src={'/images/logo.png'}
            alt='Logo'
            fill
          />
        </Box>

        <Stack spacing={1}>
          {menus.map((menu) => (
            <Link
              key={menu.title}
              href={menu.link}
            >
              <Stack
                direction={'row'}
                spacing={2}
                alignItems='center'
                sx={{
                  padding: 1,
                  borderRadius: 1,
                  ':hover': {
                    backgroundColor: '#262A33'
                  }
                }}
              >
                {typeof menu.icon === 'string' ? (
                  <Image
                    src={menu.icon}
                    alt={`${menu.title} Icon`}
                    width={16}
                    height={16}
                  />
                ) : (
                  menu.icon
                )}

                <Typography
                  variant='body1'
                  color='#fff'
                >
                  {menu.title}
                </Typography>
              </Stack>
            </Link>
          ))}
        </Stack>
      </Stack>

      {/* Resources */}
      {/* <Stack
        width={'100%'}
        spacing={1}
      >
        <Typography
          variant='body2'
          color='#68EB8E'
          marginBottom={1}
        >
          Resources
        </Typography>

        <Stack
          width={'100%'}
          direction='row'
          alignItems='center'
          spacing={1}
          justifyContent={'space-between'}
          onClick={() =>
            handleExternalLink(
              darkpoolResourceLinks.testnetGuide,
              'testnetGuide'
            )
          }
          sx={{ cursor: 'pointer' }}
        >
          <Typography
            variant='body2'
            color='#BDC1CA'
          >
            Testnet Guide
          </Typography>

          {copiedItem === 'testnetGuide' ? (
            <CheckIcon sx={{ color: '#68EB8E', fontSize: 16 }} />
          ) : (
            <Image
              src={'/images/link.png'}
              alt='Link Icon'
              width={16}
              height={16}
            />
          )}
        </Stack>
        <Stack
          width={'100%'}
          direction='row'
          alignItems='center'
          spacing={1}
          justifyContent={'space-between'}
          onClick={() =>
            handleExternalLink(darkpoolResourceLinks.faucet, 'faucet')
          }
          sx={{
            cursor: 'pointer'
          }}
        >
          <Typography
            variant='body2'
            color='#BDC1CA'
          >
            Get Sepolia ETH
          </Typography>

          {copiedItem === 'faucet' ? (
            <CheckIcon sx={{ color: '#68EB8E', fontSize: 16 }} />
          ) : (
            <Image
              src={'/images/link.png'}
              alt='Link Icon'
              width={16}
              height={16}
            />
          )}
        </Stack>
        <Stack
          width={'100%'}
          direction='row'
          alignItems='center'
          spacing={1}
          justifyContent={'space-between'}
          onClick={() =>
            handleExternalLink(
              darkpoolResourceLinks.pointDashboard,
              'pointDashboard'
            )
          }
          sx={{
            cursor: 'pointer'
          }}
        >
          <Typography
            variant='body2'
            color='#BDC1CA'
          >
            Points Dashboard
          </Typography>
          {copiedItem === 'pointDashboard' ? (
            <CheckIcon sx={{ color: '#68EB8E', fontSize: 16 }} />
          ) : (
            <Image
              src={'/images/link.png'}
              alt='Link Icon'
              width={16}
              height={16}
            />
          )}
        </Stack>
      </Stack> */}
    </Stack>
  )
}

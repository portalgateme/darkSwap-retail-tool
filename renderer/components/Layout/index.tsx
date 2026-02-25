import { Box, Stack } from '@mui/material'
import { Sidebar } from '../Sidebar'

import { Header } from '../Header'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { WalletSetupModal } from '../Modal/WalletSetupModal'
import SetupApiKeyModal from '../Modal/SetupApiKeyModal'
import { useConfigContext } from '../../contexts/ConfigContext/hooks'
import { useEffect, useMemo, useState } from 'react'
import { useCheckVersion } from '../../hooks/useCheckVersion'
import RequireVersionModal from '../Modal/RequireVersionModal'
import semver from 'semver'
import { useAutoUpdate } from '../../hooks/useAutoUpdate'
import UpdateModal from '../Modal/UpdateModal'

export const Layout = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => {
  const [openApiKeyModal, setOpenApiKeyModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [openRequireVersionModal, setOpenRequireVersionModal] = useState(false)
  const [dismissUpdateModal, setDismissUpdateModal] = useState(false)

  const { openAddModal, setOpenAddModal, onConnectWallet } = useAccountContext()
  // const { apiKey, saveApiKey } = useConfigContext()
  const { version, requiredVersion } = useCheckVersion()
  const {
    status: updateStatus,
    updateInfo,
    progress,
    error: updateError,
    isUpdateAvailable,
    downloadUpdate,
    installUpdate
  } = useAutoUpdate()

  const isVersionOutdated =
    version &&
    requiredVersion &&
    semver.lt(
      semver.coerce(version) || '0.0.0',
      semver.coerce(requiredVersion) || '0.0.0'
    )

  useEffect(() => {
    if (updateInfo?.version) {
      setDismissUpdateModal(false)
    }
  }, [updateInfo?.version])
  const shouldShowUpdateModal = useMemo(() => {
    return Boolean(
      version && updateInfo?.version && isUpdateAvailable && !dismissUpdateModal
    )
  }, [version, updateInfo, isUpdateAvailable])

  useEffect(() => {
    if (isVersionOutdated) {
      setOpenRequireVersionModal(true)
    } else {
      setOpenRequireVersionModal(false)
    }
  }, [isVersionOutdated])

  // const onSaveApiKey = async (key: string) => {
  //   setLoading(true)
  //   try {
  //     await saveApiKey(key)
  //   } catch (error) {
  //     console.error('Error saving API key:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // useEffect(() => {
  //   if (!apiKey) {
  //     setOpenApiKeyModal(true)
  //   } else {
  //     setOpenApiKeyModal(false)
  //   }
  // }, [apiKey])

  return (
    <Stack
      direction={'row'}
      sx={{
        width: '100%',
        height: '100vh'
      }}
    >
      <Sidebar />
      <Box
        sx={{
          width: '100%',
          height: 'calc(100vh - 40px)', // Adjusted height to fit within viewport minus padding
          background: '#1D2F23',
          padding: '20px 40px'
        }}
      >
        <Header title={title} />
        {children}
      </Box>

      <WalletSetupModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onConfirm={onConnectWallet}
      />

      {/* <SetupApiKeyModal
        open={openApiKeyModal}
        onClose={() => setOpenApiKeyModal(false)}
        onSubmit={onSaveApiKey}
        loading={loading}
      /> */}

      {version && (
        <RequireVersionModal
          currentVersion={version}
          requiredVersion={requiredVersion || version}
          downloadUrl='https://example.com/download'
          isOpen={openRequireVersionModal}
          onClose={() => setOpenRequireVersionModal(false)}
        />
      )}

      {version && updateInfo?.version && (
        <UpdateModal
          isOpen={shouldShowUpdateModal}
          currentVersion={version}
          latestVersion={updateInfo.version}
          status={
            updateStatus === 'downloading'
              ? 'downloading'
              : updateStatus === 'downloaded'
                ? 'downloaded'
                : updateStatus === 'checking'
                  ? 'checking'
                  : updateStatus === 'error'
                    ? 'error'
                    : 'available'
          }
          progress={progress}
          error={updateError}
          onDownload={downloadUpdate}
          onInstall={installUpdate}
          onClose={
            isVersionOutdated ? undefined : () => setDismissUpdateModal(true)
          }
        />
      )}
    </Stack>
  )
}

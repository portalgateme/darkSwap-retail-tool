import { useCallback, useEffect, useMemo, useState } from 'react'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

type UpdateInfo = {
  version: string
  releaseName?: string
}

type UpdateStatusPayload =
  | { status: 'checking' }
  | { status: 'available'; info: UpdateInfo }
  | { status: 'not-available' }
  | {
      status: 'downloading'
      progress: { percent: number; bytesPerSecond: number }
    }
  | { status: 'downloaded'; info: UpdateInfo }
  | { status: 'error'; error: string }

export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onStatus = useCallback((payload: UpdateStatusPayload) => {
    switch (payload.status) {
      case 'checking':
        setStatus('checking')
        setError(null)
        return
      case 'available':
        setStatus('available')
        setUpdateInfo(payload.info)
        setError(null)
        return
      case 'not-available':
        setStatus('not-available')
        setUpdateInfo(null)
        setProgress(null)
        setError(null)
        return
      case 'downloading':
        setStatus('downloading')
        setProgress(payload.progress.percent)
        setError(null)
        return
      case 'downloaded':
        setStatus('downloaded')
        setUpdateInfo(payload.info)
        setProgress(100)
        setError(null)
        return
      case 'error':
        setStatus('error')
        setError(payload.error)
        return
      default:
        return
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    // @ts-ignore
    if (!window.updateAPI?.checkForUpdates) return
    try {
      setStatus('checking')
      // @ts-ignore
      const result = await window.updateAPI.checkForUpdates()
      if (result?.status === 'available' && result?.info?.version) {
        setStatus('available')
        setUpdateInfo({
          version: result.info.version,
          releaseName: result.info.releaseName
        })
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Update error')
    }
  }, [])

  const downloadUpdate = useCallback(async () => {
    // @ts-ignore
    if (!window.updateAPI?.downloadUpdate) return
    try {
      // @ts-ignore
      await window.updateAPI.downloadUpdate()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Update error')
    }
  }, [])

  const installUpdate = useCallback(async () => {
    // @ts-ignore
    if (!window.updateAPI?.installUpdate) return
    try {
      // @ts-ignore
      await window.updateAPI.installUpdate()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Update error')
    }
  }, [])

  useEffect(() => {
    // @ts-ignore
    if (!window.updateAPI?.onStatus) return
    // @ts-ignore
    const unsubscribe = window.updateAPI.onStatus(onStatus)
    checkForUpdates()
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [checkForUpdates, onStatus])

  const isUpdateAvailable = useMemo(
    () =>
      status === 'available' ||
      status === 'downloading' ||
      status === 'downloaded',
    [status]
  )

  return {
    status,
    updateInfo,
    progress,
    error,
    isUpdateAvailable,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  }
}

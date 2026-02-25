import { useEffect, useState } from 'react'

type VersionState = {
  version: string | null
  error: string | null
  loading: boolean
  requiredVersion: string | null
}

export function useCheckVersion(): VersionState {
  const [version, setVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchVersion = async () => {
      try {
        // @ts-ignore
        const v = await window.electronAPI.getVersion()
        console.log('Fetched version from Electron:', v)
        if (isMounted) {
          setVersion(String(v))
          setRequiredVersion(null)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setVersion(null)
          setRequiredVersion(null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchVersion()

    return () => {
      isMounted = false
    }
  }, [])

  return { version, error, loading, requiredVersion }
}

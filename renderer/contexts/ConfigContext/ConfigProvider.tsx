import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect
} from 'react'

interface ConfigContextType {
  apiKey?: string
  verifyApiKey?: (apiKey: string) => Promise<boolean>
  saveApiKey: (apiKey: string) => Promise<void>
  saveConfigs: (newConfig: { [key: string]: string }) => Promise<void>
  isAuthenticated: boolean
}

export const ConfigContext = createContext<ConfigContextType>({
  apiKey: undefined,
  verifyApiKey: async () => false,
  saveApiKey: async () => {},
  saveConfigs: async () => {},
  isAuthenticated: false
})

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [config, setConfig] = useState<{ apiKey?: string }>({
    apiKey: undefined
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchConfigs = async () => {
    // @ts-ignore
    const configs = (await window.configAPI.getConfigs()) as [
      { key: string; value: string }
    ]
    console.log('Fetched configs:', configs)
    setConfig({
      apiKey: configs.find((config) => config.key === 'api_key')?.value
    })
  }

  const saveApiKey = async (apiKey: string) => {
    const isValid = await verifyApiKey(apiKey)
    if (!isValid) {
      alert('Invalid API key. Please try again.')
      return
    }
    // @ts-ignore
    await window.configAPI.setConfigs({ api_key: apiKey })
    await fetchConfigs()
  }

  const saveConfigs = async (newConfig: { [key: string]: string }) => {
    // @ts-ignore
    await window.configAPI.setConfigs(newConfig)
    await fetchConfigs()
  }

  const verifyApiKey = async (apiKey: string) => {
    try {
      // @ts-ignore
      const result = await window.configAPI.healthCheck(apiKey)
      console.log('health check result', result)
      if (result.healthy) {
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Error verifying API key:', error)
      return false
    }
  }

  useEffect(() => {
    if (config.apiKey) {
      verifyApiKey(config.apiKey).then((isValid) => {
        setIsAuthenticated(isValid)
      })
    } else {
      setIsAuthenticated(false)
    }
  }, [config.apiKey])

  useEffect(() => {
    fetchConfigs()
  }, [])

  return (
    <ConfigContext.Provider
      value={{
        apiKey: config.apiKey,
        saveApiKey,
        saveConfigs,
        verifyApiKey,
        isAuthenticated
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

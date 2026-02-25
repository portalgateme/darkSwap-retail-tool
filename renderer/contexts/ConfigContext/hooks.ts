import { useContext } from 'react'
import { ConfigContext } from './ConfigProvider'

export const useConfigContext = () => useContext(ConfigContext)

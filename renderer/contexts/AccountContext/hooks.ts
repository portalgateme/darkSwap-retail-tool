import { useContext } from 'react'
import { AccountContext } from './AccountProvider'

export const useAccountContext = () => useContext(AccountContext)

import { useContext } from 'react'
import { TransactionContext } from './TransactionProvider'

export const useTransactionContext = () => useContext(TransactionContext)

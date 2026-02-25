import { createContext, useState } from 'react'

export interface TransactionProviderProps {
  startLoad: (item?: string) => void
  stopLoad: () => void
  loading: boolean
  txExecuting?: string
}

export const TransactionContext = createContext<TransactionProviderProps>({
  startLoad: () => {},
  stopLoad: () => {},
  loading: false,
  txExecuting: undefined,
})

const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false)
  const [txExecuting, setTxExecuting] = useState<string>()
  const startLoad = (item?: string) => {
    setLoading(true)
    if (item) {
      setTxExecuting(item)
    }
  }

  const stopLoad = () => {
    setLoading(false)
    if (txExecuting) {
      setTxExecuting(undefined)
    }
  }

  return (
    <TransactionContext.Provider
      value={{ startLoad, stopLoad, loading, txExecuting }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export default TransactionProvider

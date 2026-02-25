import { ethers } from 'ethers'
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect
} from 'react'
import { Wallet } from '../../types'
import { useToast } from '../ToastContext'

interface AccountContextType {
  selectedAccount: Wallet | null
  accounts: Wallet[]
  setSelectedAccount: (account: Wallet | null) => void
  openAddModal: boolean
  setOpenAddModal: (open: boolean) => void
  onConnectWallet: (name: string, privateKey: string) => void
  onRemoveAccount: (id: string) => void
}

export const AccountContext = createContext<AccountContextType>({
  selectedAccount: null,
  accounts: [],
  setSelectedAccount: () => {},
  openAddModal: false,
  setOpenAddModal: () => {},
  onConnectWallet: () => {},
  onRemoveAccount: () => {}
})

export const AccountProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [accounts, setAccounts] = useState<Wallet[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Wallet | null>(null)
  const [openAddModal, setOpenAddModal] = useState<boolean>(false)
  const { showSuccess, showError, showLoading, hideToast } = useToast()

  const fetchAccounts = async () => {
    // @ts-ignore
    const fetchedAccounts = await window.accountAPI.getWallets()
    console.log('Fetched accounts:', fetchedAccounts)
    setAccounts(fetchedAccounts)
    if (!selectedAccount) {
      setSelectedAccount(fetchedAccounts[0] || null)
    }
  }

  const onConnectWallet = async (name: string, privateKey: string) => {
    const loadingToastId = showLoading('Connnecting wallet...')
    try {
      const address = ethers.computeAddress(`0x${privateKey}`)

      // @ts-ignore
      const { id } = await window.accountAPI.addWallet(
        name,
        address,
        privateKey,
        'privateKey'
      )
      console.log('Added wallet with id:', id)
      await fetchAccounts()
      setOpenAddModal(false)
      hideToast(loadingToastId)
      showSuccess('Wallet added successfully!')
    } catch (error) {
      hideToast(loadingToastId)
      showError('Failed to add wallet. Please check the private key.')
      console.error('Error adding wallet:', error)
    }
  }

  const onRemoveAccount = async (id: string) => {
    const loadingToastId = showLoading('Removing wallet...')
    try {
      // @ts-ignore
      await window.accountAPI.removeWallet(id)
      console.log('Removed wallet with id:', id)
      await fetchAccounts()
      setSelectedAccount((prev) => (prev && prev.id === id ? null : prev))
      hideToast(loadingToastId)
      showSuccess('Wallet removed successfully!')
    } catch (error) {
      hideToast(loadingToastId)
      showError('Failed to remove wallet. Please try again.')
      console.error('Error removing wallet:', error)
    }
  }
  useEffect(() => {
    fetchAccounts()
  }, [])

  return (
    <AccountContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        accounts,
        openAddModal,
        setOpenAddModal,
        onConnectWallet,
        onRemoveAccount
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

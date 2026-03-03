import { Button, Stack, Typography } from '@mui/material'
import React, { use, useEffect, useMemo, useState } from 'react'
import { useAccountContext } from '../../contexts/AccountContext/hooks'
import { useAssetPairContext } from '../../contexts/AssetPairContext/hooks'
import { useChainContext } from '../../contexts/ChainContext/hooks'
import { useToast } from '../../contexts/ToastContext'
import {
  AssetPairDto,
  AutoOrderJobDto,
  AutoOrderJobStatus,
  CreateAutoOrderFormData,
  EditAutoOrderFormData,
  OrderDirection,
  OrderType,
  SortType,
  StpMode,
  TimeInForce
} from '../../types'
import { getMarketPriceFromBinance } from '../../services/orderService'
import { AutoOrdersTable } from '../Table/AutoOrdersTable'
import { AutoOrderDetailModal } from '../Modal/AutoOrderDetailModal'
import { CreateAutoOrderModal } from '../Modal/CreateAutoOrderModal'
import { toLocalDateTimeInput } from '../../utils/format'

export const formatDate = (value?: number | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export const statusLabel = (status?: AutoOrderJobStatus) => {
  switch (status) {
    case AutoOrderJobStatus.ACTIVE:
      return 'Active'
    case AutoOrderJobStatus.PAUSED:
      return 'Paused'
    case AutoOrderJobStatus.COMPLETED:
      return 'Completed'
    case AutoOrderJobStatus.CANCELLED:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

export const AutoOrderContent = () => {
  const { chainId } = useChainContext()
  const { selectedAccount } = useAccountContext()
  const { list, assetPair } = useAssetPairContext()
  const { showError, showLoading, hideToast, showSuccess } = useToast()

  const [formData, setFormData] = useState<CreateAutoOrderFormData>({
    price: '',
    marketPrice: '',
    minPrice: '0',
    maxPrice: '0',
    amountOut: '',
    feeRatio: '0.001',
    startAt: '',
    endAt: '',
    intervalSeconds: '15',
    orderDirection: OrderDirection.SELL,
    orderType: OrderType.LIMIT,
    maxOrdersPerDay: '8'
  })

  const [jobs, setJobs] = useState<AutoOrderJobDto[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [loading, setLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<AutoOrderJobDto | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<EditAutoOrderFormData>({
    assetPairId: '',
    orderDirection: OrderDirection.SELL,
    orderType: OrderType.LIMIT,
    price: '',
    marketPrice: '',
    minPrice: '',
    maxPrice: '',
    amountOut: '',
    feeRatio: '0.001', // default value
    startAt: '',
    endAt: '',
    intervalSeconds: '15'
  })

  const selectedPair = assetPair
  const [selectedWallet, setSelectedWallet] = useState(selectedAccount || null)

  const fetchMarketPrice = async (pair: AssetPairDto) => {
    const price = await getMarketPriceFromBinance(
      pair.baseSymbol + pair.quoteSymbol
    )
    const value = Number(price)
    if (Number.isNaN(value) || value <= 0) {
      throw new Error('Invalid market price')
    }
    return value.toFixed(5) // format to 5 decimal places for better display, you can adjust as needed
  }

  useEffect(() => {
    if (!selectedWallet && selectedAccount) {
      setSelectedWallet(selectedAccount)
    }
  }, [selectedAccount, selectedWallet])

  // Fetch market price when selected pair changes in create form
  useEffect(() => {
    if (!selectedPair || !createOpen) return
    const run = async () => {
      try {
        const price = await fetchMarketPrice(selectedPair)
        setFormData((prev) => ({
          ...prev,
          marketPrice: price,
          price
        }))
      } catch (error) {
        console.error('Failed to fetch market price for auto order', error)
      }
    }
    run()
  }, [selectedPair, createOpen])

  // useEffect(() => {
  //   if (!editForm.assetPairId) return
  //   const pair = list.find((p) => p.id === editForm.assetPairId)
  //   if (!pair) return
  //   const run = async () => {
  //     try {
  //       const price = await fetchMarketPrice(pair)
  //       setEditForm((prev) => ({
  //         ...prev,
  //         marketPrice: price
  //       }))
  //     } catch (error) {
  //       console.error('Failed to fetch market price for edit form', error)
  //     }
  //   }
  //   run()
  // }, [editForm.assetPairId, list])

  // useEffect(() => {
  //   if (!chainId || list.length === 0) return
  //   let cancelled = false

  //   const updateAllMarketPrices = async () => {
  //     await Promise.all(
  //       list.map(async (pair) => {
  //         try {
  //           const price = await fetchMarketPrice(pair)
  //           if (cancelled) return
  //           // @ts-ignore
  //           await window.autoOrderAPI.updateMarketPrice(chainId, pair.id, price)
  //         } catch (error) {
  //           console.error(
  //             `Failed to update market price for ${pair.baseSymbol}/${pair.quoteSymbol}`,
  //             error
  //           )
  //         }
  //       })
  //     )
  //   }

  //   updateAllMarketPrices()
  //   const interval = setInterval(updateAllMarketPrices, 15000)
  //   return () => {
  //     cancelled = true
  //     clearInterval(interval)
  //   }
  // }, [chainId, list])

  const canSubmit = useMemo(() => {
    return (
      !!chainId &&
      !!selectedWallet &&
      !!selectedPair &&
      (formData.orderType === OrderType.MARKET || formData.price !== '') &&
      formData.marketPrice !== '' &&
      formData.amountOut !== '' &&
      Number(formData.intervalSeconds) > 0 &&
      (formData.endAt && formData.startAt
        ? Number(formData.endAt) > Number(formData.startAt)
        : true)
    )
  }, [chainId, selectedWallet, selectedPair, formData])

  const fetchJobs = async () => {
    if (!chainId) return
    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.autoOrderAPI.getJobsByPage(
        chainId,
        1, // TODO: hardcoded page, need to implement pagination in the future
        10, // TODO: hardcoded limit, need to implement pagination in the future
        SortType.NEWEST,
        undefined, // TODO: hardcoded page, need to implement pagination in the future
        undefined, // TODO: hardcoded page, need to implement pagination in the future
        true // includeOrders, set to true to fetch orders for each job
      )
      console.log('Fetched auto order jobs', result)
      setJobs(result.jobs || [])
      setTotalJobs(result.total || 0)
    } catch (error) {
      console.error('Failed to fetch auto order jobs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [chainId])

  // const toDateTimeInput = (value?: number | null) => {
  //   if (!value) return ''
  //   return new Date(value).toLocaleString().slice(0, 16)
  // }

  const openDetail = (job: AutoOrderJobDto) => {
    setSelectedJob(job)
    setEditForm({
      assetPairId: job.assetPairId,
      orderDirection: job.orderDirection,
      orderType: job.orderType,
      price: job.price || '',
      marketPrice: job.marketPrice || '',
      minPrice: job.minPrice,
      maxPrice: job.maxPrice,
      amountOut: job.amountOut,
      feeRatio: job.feeRatio,
      startAt: toLocalDateTimeInput(job.startAt),
      endAt: toLocalDateTimeInput(job.endAt),
      intervalSeconds: job.intervalSeconds.toString()
    })
    setEditMode(false)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedJob(null)
    setEditMode(false)
  }

  const onOpenCreate = () => {
    setCreateOpen(true)
  }

  const onCloseCreate = () => {
    setCreateOpen(false)
    setFormData((prev) => ({
      ...prev,
      price: '',
      marketPrice: '',
      minPrice: '0',
      maxPrice: '0',
      amountOut: '',
      feeRatio: '0.001',
      startAt: '',
      endAt: '',
      intervalSeconds: '15',
      orderDirection: OrderDirection.SELL,
      orderType: OrderType.LIMIT,
      maxOrdersPerDay: '8'
    }))
    setSelectedWallet(selectedAccount || null)
  }

  const resetFormData = () => {
    setFormData((prev) => ({
      ...prev,
      price: '',
      marketPrice: '',
      minPrice: '0',
      maxPrice: '0',
      amountOut: '',
      feeRatio: '0.001',
      startAt: '',
      endAt: '',
      intervalSeconds: '15',
      orderDirection: OrderDirection.SELL,
      orderType: OrderType.LIMIT,
      maxOrdersPerDay: '8'
    }))
  }

  const onCreateJob = async () => {
    if (!chainId || !selectedWallet || !selectedPair) return
    if (!canSubmit) {
      showError('Please fill in all required fields')
      return
    }

    const toastId = showLoading('Creating auto order job...')
    try {
      if (
        formData.startAt &&
        formData.endAt &&
        formData.endAt <= formData.startAt
      ) {
        showError('End date must be after start date')
        hideToast(toastId)
        return
      }

      const payload: AutoOrderJobDto = {
        jobId: crypto.randomUUID(),
        chainId,
        wallet: selectedWallet.address,
        assetPairId: selectedPair.id,
        orderDirection: formData.orderDirection,
        orderType: formData.orderType,
        timeInForce: TimeInForce.GTC,
        stpMode: StpMode.NONE,
        price: formData.orderType === OrderType.MARKET ? '0' : formData.price,
        marketPrice: formData.marketPrice || '0',
        minPrice: '0',
        maxPrice: '0',
        amountOut: formData.amountOut,
        feeRatio: formData.feeRatio,
        startAt: formData.startAt ? +formData.startAt : Date.now(),
        endAt: formData.endAt ? +formData.endAt : undefined,
        intervalSeconds: Number(formData.intervalSeconds),
        status: AutoOrderJobStatus.ACTIVE,
        maxOrdersPerDay: Number(formData.maxOrdersPerDay)
      }

      // @ts-ignore
      await window.autoOrderAPI.createJob(payload)

      showSuccess('Auto order job created')
      resetFormData()
      setCreateOpen(false)
      fetchJobs()
    } catch (error) {
      console.error('Create job failed', error)
      showError('Failed to create job')
    } finally {
      hideToast(toastId)
    }
  }

  const onPause = async (jobId: string) => {
    const toastId = showLoading('Pausing job...')
    try {
      // @ts-ignore
      await window.autoOrderAPI.pauseJob(jobId)
      showSuccess('Job paused')
      fetchJobs()
    } catch (error) {
      console.error('Pause job failed', error)
      showError('Failed to pause job')
    } finally {
      hideToast(toastId)
    }
  }

  const onResume = async (jobId: string) => {
    const toastId = showLoading('Resuming job...')
    try {
      // @ts-ignore
      await window.autoOrderAPI.resumeJob(jobId)
      showSuccess('Job resumed')
      fetchJobs()
    } catch (error) {
      console.error('Resume job failed', error)
      showError('Failed to resume job')
    } finally {
      hideToast(toastId)
    }
  }

  const onCancel = async (jobId: string) => {
    const toastId = showLoading('Cancelling job...')
    try {
      // @ts-ignore
      await window.autoOrderAPI.cancelJob(jobId)
      showSuccess('Job cancelled')
      fetchJobs()
    } catch (error) {
      console.error('Cancel job failed', error)
      showError('Failed to cancel job')
    } finally {
      hideToast(toastId)
    }
  }

  const onUpdateJob = async () => {
    if (!selectedJob || !chainId) return

    const toastId = showLoading('Updating job...')
    try {
      const startAt = editForm.startAt
        ? new Date(editForm.startAt).getTime()
        : Date.now()
      const endAt = editForm.endAt
        ? new Date(editForm.endAt).getTime()
        : undefined

      if (endAt && endAt <= startAt) {
        showError('End date must be after start date')
        hideToast(toastId)
        return
      }

      const payload: AutoOrderJobDto = {
        ...selectedJob,
        assetPairId: editForm.assetPairId,
        orderDirection: editForm.orderDirection,
        orderType: editForm.orderType,
        timeInForce: TimeInForce.GTC,
        stpMode: StpMode.NONE,
        price: editForm.orderType === OrderType.MARKET ? '0' : editForm.price,
        marketPrice: editForm.marketPrice || selectedJob.marketPrice || '0',
        minPrice: editForm.minPrice,
        maxPrice: editForm.maxPrice,
        amountOut: editForm.amountOut,
        feeRatio: editForm.feeRatio,
        startAt,
        endAt,
        intervalSeconds: Number(editForm.intervalSeconds)
      }

      // @ts-ignore
      const updated = await window.autoOrderAPI.updateJob(payload)
      showSuccess('Job updated')
      setSelectedJob(updated)
      setEditMode(false)
      fetchJobs()
    } catch (error) {
      console.error('Update job failed', error)
      showError('Failed to update job')
    } finally {
      hideToast(toastId)
    }
  }

  const isEditable =
    selectedJob &&
    selectedJob.status !== AutoOrderJobStatus.CANCELLED &&
    selectedJob.status !== AutoOrderJobStatus.COMPLETED &&
    !selectedJob.activeOrderId

  const onChangeData = (data: Partial<CreateAutoOrderFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }))
  }

  const onChangeEditForm = (data: Partial<EditAutoOrderFormData>) => {
    setEditForm((prev) => ({
      ...prev,
      ...data
    }))
  }

  const onChangeEditMode = () => {
    setEditMode((prev) => !prev)
  }

  return (
    <Stack
      mt={2}
      spacing={3}
      sx={{ width: '100%' }}
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='flex-end'
      >
        {/* <Stack>
          <Typography
            variant='h5'
            color='#F3F4F6'
          >
            Auto Order Jobs
          </Typography>
          <Typography
            variant='body2'
            color='#BDC1CA'
          >
            Create and manage automated orders by conditions
          </Typography>
        </Stack> */}
        <Button
          variant='contained'
          sx={{ background: '#68EB8E', color: '#0C1114' }}
          onClick={onOpenCreate}
        >
          Create Auto Order
        </Button>
      </Stack>

      <AutoOrdersTable
        jobs={jobs}
        openDetail={openDetail}
        onPause={onPause}
        onResume={onResume}
        onCancel={onCancel}
        loading={loading}
      />

      <AutoOrderDetailModal
        detailOpen={detailOpen}
        closeDetail={closeDetail}
        selectedJob={selectedJob}
        isEditable={isEditable}
        editForm={editForm}
        onChangeEditForm={onChangeEditForm}
        editMode={editMode}
        onChangeEditMode={onChangeEditMode}
        onUpdateJob={onUpdateJob}
      />

      <CreateAutoOrderModal
        open={createOpen}
        onClose={onCloseCreate}
        onCreateJob={onCreateJob}
        disabled={!canSubmit}
        formData={formData}
        onChangeData={onChangeData}
        selectedWallet={selectedWallet || undefined}
        onChangeWallet={(wallet) => setSelectedWallet(wallet)}
      />
    </Stack>
  )
}

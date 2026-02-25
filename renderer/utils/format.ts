export const shorterAddress = (address?: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const isSameAddress = (
  address1?: string,
  address2?: string
): boolean => {
  if (!address1 || !address2) return false
  return address1.toLowerCase() === address2.toLowerCase()
}

export const toDateTimeInput = (value?: number | string | null) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

// Format 2026-02-21T21:53 to timestamp
export const fromDateTimeInput = (value: string): number | null => {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

// Format timestamp to 2026-02-21T21:53 but local timezone
export const toLocalDateTimeInput = (value?: number | string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const tzOffset = date.getTimezoneOffset() * 60000
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16)
  return localISOTime
}

export const fromLocalDateTimeInput = (value: string): number | null => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  const tzOffset = date.getTimezoneOffset() * 60000
  return date.getTime() + tzOffset
}

export const toDateString = (timestamp?: number | string | null): string => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

export const toRelativeTime = (timestamp?: number | string | null): string => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = Number(timestamp) - now
  if (diff < 0) {
    return `${Math.abs(Math.round(diff / 60000))} minutes ago`
  } else {
    return `in ${Math.round(diff / 60000)} minutes`
  }
}

export const toDateTimeLocalString = (
  timestamp?: number | string | null
): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const tzOffset = date.getTimezoneOffset() * 60000
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16)
  return localISOTime.replace('T', ' ')
}

export const toDateStringWithLocalTimezone = (
  timestamp?: number | string | null
): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export const toRelativeTimeWithLocalTimezone = (
  timestamp?: number | string | null
): string => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = Number(timestamp) - now
  if (diff < 0) {
    return `${Math.abs(Math.round(diff / 60000))} minutes ago`
  } else {
    return `in ${Math.round(diff / 60000)} minutes`
  }
}
export const toDateTimeString = (
  timestamp?: number | string | null
): string => {
  if (!timestamp) return ''
  return new Date(timestamp).toISOString().slice(0, 16)
}

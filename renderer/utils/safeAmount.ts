export const safeAmountWithDecimals = (amount: string, decimals: number) => {
  // Handle empty or invalid input
  if (!amount || amount === '') return ''

  // Split by decimal point
  const parts = amount.split('.')

  // If no decimal part, return as is
  if (parts.length === 1) return amount

  // If decimal part exceeds allowed decimals, truncate it
  if (parts.length === 2 && parts[1].length > decimals) {
    return `${parts[0]}.${parts[1].slice(0, decimals)}`
  }

  return amount
}

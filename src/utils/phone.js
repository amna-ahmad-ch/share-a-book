/** Normalize Pakistani input to E.164 (+92XXXXXXXXXX). */
export function toE164Pakistan(input) {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+92${digits.slice(1)}`
  }
  if (digits.length === 10) {
    return `+92${digits}`
  }
  return null
}

export function formatPhoneDisplay(e164) {
  if (!e164) return ''
  const d = e164.replace(/\D/g, '')
  if (d.length >= 12) {
    return `+92 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  return e164
}

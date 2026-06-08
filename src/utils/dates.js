export function daysSince(timestamp) {
  if (!timestamp) return 0
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function daysSinceLabel(timestamp) {
  const days = daysSince(timestamp)
  if (days === 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  return `Posted ${days} days ago`
}

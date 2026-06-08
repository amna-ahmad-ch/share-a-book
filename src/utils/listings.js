export function listingTimestamp(listing) {
  const t = listing?.createdAt
  if (!t) return 0
  return t.seconds ?? t.toMillis?.() / 1000 ?? new Date(t).getTime() / 1000 ?? 0
}

export function sortListingsNewestFirst(listings) {
  return [...listings].sort((a, b) => listingTimestamp(b) - listingTimestamp(a))
}

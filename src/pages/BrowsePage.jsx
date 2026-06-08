import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { CATEGORIES, GRADES, LISTING_TYPES } from '../constants'
import FilterChips from '../components/FilterChips'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../contexts/AuthContext'

export default function BrowsePage() {
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [blockedUids, setBlockedUids] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('all')

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoadError('')
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load listings:', err)
        setLoadError(
          err.code === 'failed-precondition'
            ? 'Firestore index is building or missing. Open the link in your browser console (F12), or create indexes in Firebase Console → Firestore → Indexes. Wait 2–5 min after creating, then refresh.'
            : 'Could not load books. Please refresh and try again.',
        )
        setLoading(false)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isBlocked', '==', true))
    const unsub = onSnapshot(q, (snap) => {
      setBlockedUids(new Set(snap.docs.map((d) => d.id)))
    })
    return unsub
  }, [])

  const visible = useMemo(() => {
    return listings.filter((l) => !blockedUids.has(l.postedByUid))
  }, [listings, blockedUids])

  const filtered = useMemo(() => {
    return visible.filter((l) => {
      if (grade && l.grade !== grade) return false
      if (category && l.category !== category) return false
      if (type === 'free' && l.type !== 'free') return false
      if (type === 'sell' && l.type !== 'sell') return false
      return true
    })
  }, [visible, grade, category, type])

  const hasFilters = Boolean(grade || category || type !== 'all')

  function emptyMessage() {
    if (loadError) return loadError
    if (!hasFilters && visible.length === 0) {
      return 'No books listed yet. Be the first — tap Post to add one!'
    }
    return 'No books match your filters. Try changing filters or post one!'
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-primary">Browse Books</h1>
        {profile?.school && (
          <p className="text-xs text-primary/50 mt-0.5">{profile.school}</p>
        )}
      </header>

      <section className="space-y-2">
        <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Grade</p>
        <FilterChips
          options={GRADES}
          value={grade}
          onChange={setGrade}
        />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Subject</p>
        <FilterChips
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Type</p>
        <FilterChips
          options={LISTING_TYPES.filter((t) => t.value !== 'all').map((t) => ({
            value: t.value,
            label: t.label,
          }))}
          value={type === 'all' ? '' : type}
          onChange={(v) => setType(v || 'all')}
          allLabel="All"
        />
      </section>

      <p className="text-sm text-primary/60">
        {loading
          ? 'Loading…'
          : loadError
            ? 'Could not load books'
            : `${filtered.length} book${filtered.length === 1 ? '' : 's'} found`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-primary/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-12 ${loadError ? 'text-red-600' : 'text-primary/50'}`}>
          <span className="text-4xl block mb-2">{loadError ? '⚠️' : '📭'}</span>
          <p className="text-sm leading-relaxed px-4">{emptyMessage()}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

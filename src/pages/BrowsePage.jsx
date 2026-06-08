import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { LISTING_TYPES } from '../constants'
import FilterSheet from '../components/FilterSheet'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../contexts/AuthContext'
import { loadBrowseFilters, saveBrowseFilters } from '../utils/browseFilters'

export default function BrowsePage() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [blockedUids, setBlockedUids] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    const saved = loadBrowseFilters(user.uid)
    setGrade(saved.grade)
    setCategory(saved.category)
    setType(saved.type)
    setFiltersLoaded(true)
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || !filtersLoaded) return
    saveBrowseFilters(user.uid, { grade, category, type })
  }, [user?.uid, filtersLoaded, grade, category, type])

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

  const activeFilterCount = [
    grade,
    category,
    type !== 'all' ? type : '',
  ].filter(Boolean).length

  const activeFilters = useMemo(() => {
    const filters = []
    if (grade) filters.push({ key: 'grade', label: grade, clear: () => setGrade('') })
    if (category) filters.push({ key: 'category', label: category, clear: () => setCategory('') })
    if (type !== 'all') {
      const label = LISTING_TYPES.find((t) => t.value === type)?.label
      if (label) filters.push({ key: 'type', label, clear: () => setType('all') })
    }
    return filters
  }, [grade, category, type])

  function clearFilters() {
    setGrade('')
    setCategory('')
    setType('all')
  }

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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-primary/10 text-sm font-semibold text-primary shadow-sm active:scale-[0.99] transition-transform"
          >
            <span aria-hidden>🔍</span>
            Filters
            {activeFilterCount > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-filter-soft text-primary border border-filter-border text-xs font-semibold leading-5">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 px-3 py-2.5 rounded-xl text-sm font-medium text-primary/60 border border-primary/10"
            >
              Clear
            </button>
          )}
        </div>
        {hasFilters && (
          <div className="rounded-xl bg-white border border-primary/20 px-3 py-2.5 flex flex-wrap items-center gap-2 shadow-sm">
            <span className="text-[11px] font-semibold text-primary/50 uppercase tracking-wide shrink-0">
              Showing
            </span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 rounded-full bg-filter-soft border border-filter-border pl-2.5 pr-1 py-1 text-xs font-semibold text-primary"
              >
                {filter.label}
                <button
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Remove ${filter.label} filter`}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-primary/40 text-sm leading-none active:text-primary"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        grade={grade}
        onGradeChange={setGrade}
        category={category}
        onCategoryChange={setCategory}
        type={type}
        onTypeChange={setType}
        onClearAll={() => {
          clearFilters()
          setFiltersOpen(false)
        }}
      />

      <p className="text-sm text-primary/60">
        {loading
          ? 'Loading…'
          : loadError
            ? 'Could not load books'
            : `${filtered.length} book${filtered.length === 1 ? '' : 's'} found`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

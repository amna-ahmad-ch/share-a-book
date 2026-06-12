import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MAX_LISTINGS } from '../constants'
import { deactivateListing } from '../utils/listingStorage'

export default function MyBooksPage() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const count = profile?.activeListingCount ?? 0

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'listings'),
      where('postedByUid', '==', user.uid),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [user])

  async function confirmDelete() {
    if (!deleteId) return
    const listing = listings.find((l) => l.id === deleteId)
    if (!listing) return
    setDeleting(true)
    try {
      await deactivateListing(deleteId, listing)
      await updateDoc(doc(db, 'users', user.uid), {
        activeListingCount: increment(-1),
      })
      setDeleteId(null)
    } catch {
      alert('Could not delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-primary">My Books</h1>
        <p className="text-sm text-primary/50">
          {count} of {MAX_LISTINGS} listings used
        </p>
      </header>

      {profile && (
        <div className="rounded-xl bg-white p-4 border border-primary/5 space-y-1">
          <p className="font-medium text-primary">{profile.name}</p>
          <p className="text-sm text-primary/50">{profile.school}</p>
          {profile.isAdmin && (
            <Link to="/admin" className="text-sm text-accent font-medium inline-block mt-2">
              Admin panel →
            </Link>
          )}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="text-center py-8 text-primary/50">
          <span className="text-4xl block mb-2">📚</span>
          <p className="mb-4">You have no active listings yet.</p>
          <Link to="/post" className="text-accent font-medium">Post your first book</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="rounded-xl bg-white border border-primary/10 p-3 flex gap-3"
            >
              <div className="w-16 h-16 shrink-0 rounded-lg bg-white border border-primary/10 flex items-center justify-center overflow-hidden">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">📚</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm truncate">{listing.title}</p>
                <p className="text-xs text-primary/50">{listing.grade} · {listing.category}</p>
                <p className="text-xs font-bold text-accent mt-1">
                  {listing.type === 'free' ? 'FREE' : `Rs ${listing.price}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteId(listing.id)}
                className="shrink-0 self-center text-xs bg-red-500 text-white px-2 py-1.5 rounded font-bold"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-primary mb-2">Delete listing?</h3>
            <p className="text-sm text-primary/60 mb-4">
              Are you sure you want to delete this listing? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-lg border border-primary/20"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

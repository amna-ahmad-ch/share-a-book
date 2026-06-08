import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
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
import { formatSchoolLabel, parseSchoolDoc } from '../utils/school'

export default function AdminPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('listings')
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [schools, setSchools] = useState([])
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newSchoolBranch, setNewSchoolBranch] = useState('')
  const [newSchoolCity, setNewSchoolCity] = useState('')
  const [schoolError, setSchoolError] = useState('')
  const [reports, setReports] = useState([])
  const [reportsError, setReportsError] = useState('')

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snap) => {
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setUsers(list)
    })
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setReportsError('')
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => {
        console.error('Failed to load reports:', err)
        setReports([])
        setReportsError(
          `Could not load reports (${err.code || 'error'}). Publish the latest firestore.rules in Firebase Console.`,
        )
      },
    )
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'schools'), (snap) => {
      const list = snap.docs.map((d) => parseSchoolDoc(d.id, d.data()))
      list.sort((a, b) => formatSchoolLabel(a).localeCompare(formatSchoolLabel(b)))
      setSchools(list)
    })
  }, [])

  async function deleteListing(listing) {
    if (!confirm('Delete this listing?')) return
    await updateDoc(doc(db, 'listings', listing.id), { isActive: false })
    if (listing.postedByUid) {
      await updateDoc(doc(db, 'users', listing.postedByUid), {
        activeListingCount: increment(-1),
      })
    }
  }

  async function toggleBlock(uid, currentlyBlocked) {
    const action = currentlyBlocked ? 'unblock' : 'block'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    await updateDoc(doc(db, 'users', uid), { isBlocked: !currentlyBlocked })
  }

  async function addSchool(e) {
    e.preventDefault()
    setSchoolError('')
    if (!newSchoolName.trim()) {
      setSchoolError('Enter a school name.')
      return
    }
    try {
      await addDoc(collection(db, 'schools'), {
        name: newSchoolName.trim(),
        branch: newSchoolBranch.trim() || '',
        city: newSchoolCity.trim() || '',
      })
      setNewSchoolName('')
      setNewSchoolBranch('')
      setNewSchoolCity('')
    } catch {
      setSchoolError('Could not add school. Check you have admin access.')
    }
  }

  async function removeSchool(id, name) {
    if (!confirm(`Remove "${name}" from the school list?`)) return
    await deleteDoc(doc(db, 'schools', id))
  }

  async function dismissReport(report) {
    await deleteDoc(doc(db, 'reports', report.id))
  }

  async function deleteReportedListing(report) {
    const listing = listings.find((l) => l.id === report.listingId)
    if (!listing?.isActive) {
      await dismissReport(report)
      return
    }
    if (!confirm(`Delete listing "${report.listingTitle}"?`)) return
    await updateDoc(doc(db, 'listings', report.listingId), { isActive: false })
    if (listing.postedByUid) {
      await updateDoc(doc(db, 'users', listing.postedByUid), {
        activeListingCount: increment(-1),
      })
    }
    await dismissReport(report)
  }

  const pendingReports = reports

  return (
    <div className="space-y-4">
      <Link to="/my-books" className="text-sm text-accent font-medium inline-block">
        ← Back to My Books
      </Link>
      <h1 className="text-xl font-bold text-primary">Admin Panel</h1>

      <div className="flex rounded-lg bg-white border border-primary/10 p-1">
        {[
          { id: 'listings', label: 'Listings' },
          { id: 'reports', label: pendingReports.length ? `Reports (${pendingReports.length})` : 'Reports' },
          { id: 'users', label: 'Users' },
          { id: 'schools', label: 'Schools' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-md text-xs font-medium ${
              tab === t.id ? 'bg-primary text-white' : 'text-primary/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <ul className="space-y-2">
          {listings.length === 0 ? (
            <p className="text-sm text-primary/50 text-center py-6">No active listings.</p>
          ) : (
            listings.map((l) => (
              <li
                key={l.id}
                className="rounded-lg bg-white p-3 border border-primary/10 flex justify-between items-start gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-primary text-sm truncate">{l.title}</p>
                  <p className="text-xs text-primary/50">
                    {l.postedBy} · {l.grade}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteListing(l)}
                  className="shrink-0 text-xs bg-red-500 text-white px-2 py-1 rounded font-bold"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'reports' && (
        <ul className="space-y-2">
          {reportsError ? (
            <p className="text-sm text-red-600 text-center py-4 px-2 leading-relaxed">{reportsError}</p>
          ) : pendingReports.length === 0 ? (
            <p className="text-sm text-primary/50 text-center py-6">No pending reports.</p>
          ) : (
            pendingReports.map((r) => (
              <li
                key={r.id}
                className="rounded-lg bg-white p-3 border border-red-200"
              >
                <p className="font-medium text-primary text-sm">{r.listingTitle}</p>
                <p className="text-xs text-primary/50 mt-0.5">
                  Posted by {r.posterName}
                </p>
                <p className="text-xs text-primary/40 mt-0.5">
                  Reported by {r.reportedByName}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/listing/${r.listingId}`}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteReportedListing(r)}
                    className="text-xs px-2 py-1 rounded bg-red-500 text-white font-bold"
                  >
                    Delete listing
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissReport(r)}
                    className="text-xs px-2 py-1 rounded border border-primary/20 text-primary/60"
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'users' && (
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="rounded-lg bg-white p-3 border border-primary/10"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-primary text-sm">{u.name}</p>
                  <p className="text-xs text-primary/50">{u.school}</p>
                  <p className="text-xs text-primary/40 mt-0.5">
                    {u.activeListingCount ?? 0} listings
                    {u.isAdmin && ' · Admin'}
                    {u.isBlocked && ' · Blocked'}
                  </p>
                </div>
                {!u.isAdmin && (
                  <button
                    type="button"
                    onClick={() => toggleBlock(u.id, u.isBlocked)}
                    className={`shrink-0 text-xs px-2 py-1 rounded font-bold ${
                      u.isBlocked
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'schools' && (
        <div className="space-y-4">
          <form onSubmit={addSchool} className="rounded-xl bg-white p-4 border border-primary/10 space-y-3">
            <p className="text-sm font-medium text-primary">Add a school</p>
            <input
              type="text"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              placeholder="School name"
              className="w-full px-3 py-2 rounded-lg border border-primary/20 text-sm"
            />
            <input
              type="text"
              value={newSchoolBranch}
              onChange={(e) => setNewSchoolBranch(e.target.value)}
              placeholder="Branch / campus (optional)"
              className="w-full px-3 py-2 rounded-lg border border-primary/20 text-sm"
            />
            <input
              type="text"
              value={newSchoolCity}
              onChange={(e) => setNewSchoolCity(e.target.value)}
              placeholder="City (optional)"
              className="w-full px-3 py-2 rounded-lg border border-primary/20 text-sm"
            />
            {schoolError && <p className="text-red-600 text-xs">{schoolError}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-accent text-primary text-sm font-bold"
            >
              Add school
            </button>
          </form>

          <ul className="space-y-2">
            {schools.length === 0 ? (
              <p className="text-sm text-primary/50 text-center py-4">No schools yet. Add one above.</p>
            ) : (
              schools.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg bg-white p-3 border border-primary/10 flex justify-between items-center gap-2"
                >
                  <div>
                    <p className="font-medium text-primary text-sm">{formatSchoolLabel(s)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSchool(s.id, s.name)}
                    className="text-xs text-red-500 font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

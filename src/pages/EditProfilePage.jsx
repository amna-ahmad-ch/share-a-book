import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MAX_NAME_LENGTH } from '../constants'
import { useSchools } from '../hooks/useSchools'
import {
  findSchoolIdForProfile,
  formatSchoolLabel,
  formatSchoolProfile,
} from '../utils/school'

export default function EditProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { schools, loading: schoolsLoading, error: schoolsError } = useSchools()

  const [name, setName] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!profile || initialized || schoolsLoading) return
    setName(profile.name || '')
    setSchoolId(findSchoolIdForProfile(schools, profile.school))
    setInitialized(true)
  }, [profile, schools, schoolsLoading, initialized])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your full name.')
      return
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }

    const picked = schools.find((s) => s.id === schoolId)
    if (!picked) {
      setError('Please select your school from the list.')
      return
    }

    const schoolLabel = formatSchoolProfile(picked)
    const unchanged =
      trimmedName === (profile?.name || '').trim() && schoolLabel === (profile?.school || '')

    if (unchanged) {
      navigate('/my-books', { replace: true })
      return
    }

    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: trimmedName,
        school: schoolLabel,
      })

      const listingsSnap = await getDocs(
        query(
          collection(db, 'listings'),
          where('postedByUid', '==', user.uid),
          where('isActive', '==', true),
        ),
      )

      if (!listingsSnap.empty) {
        const batch = writeBatch(db)
        listingsSnap.docs.forEach((listingDoc) => {
          batch.update(listingDoc.ref, {
            postedBy: trimmedName,
            school: schoolLabel,
          })
        })
        await batch.commit()
      }

      navigate('/my-books', { replace: true })
    } catch (err) {
      console.error('Profile update failed:', err)
      setError('Could not save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="text-primary/50 animate-pulse py-12 text-center">Loading…</div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/my-books" className="text-sm text-accent font-medium inline-block">
        ← Back to My Books
      </Link>

      <header>
        <h1 className="text-xl font-bold text-primary">Edit profile</h1>
        <p className="text-sm text-primary/50 mt-1">Update your name or school.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-primary">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
            placeholder="e.g. Ayesha Khan"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-primary">Mobile number</span>
          <input
            type="text"
            value={profile.phone || user?.phoneNumber || ''}
            readOnly
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/10 bg-primary/[0.03] text-primary/50"
          />
          <p className="text-xs text-primary/40 mt-1">Phone number cannot be changed here.</p>
        </label>

        {schoolsLoading ? (
          <p className="text-sm text-primary/50">Loading schools…</p>
        ) : schoolsError ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {schoolsError}
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-primary">School</span>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
            >
              <option value="">Select your school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSchoolLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || schoolsLoading || !schoolId}
          className="w-full py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

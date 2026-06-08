import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { formatSchoolLabel, formatSchoolProfile, parseSchoolDoc } from '../utils/school'

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [schools, setSchools] = useState([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [schoolsError, setSchoolsError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canContinue = schools.length > 0 && school

  useEffect(() => {
    if (!user) return

    let cancelled = false
    setSchoolsLoading(true)
    setSchoolsError('')

    getDocs(collection(db, 'schools'))
      .then((snap) => {
        if (cancelled) return
        const list = snap.docs
          .map((d) => parseSchoolDoc(d.id, d.data()))
          .filter((s) => s.name)
          .sort((a, b) => a.name.localeCompare(b.name))
        setSchools(list)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load schools:', err)
        setSchoolsError(
          err?.code === 'permission-denied'
            ? 'Could not load schools — check Firestore security rules are published.'
            : 'Could not load schools. Please refresh and try again.',
        )
      })
      .finally(() => {
        if (!cancelled) setSchoolsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    const picked = schools.find((s) => s.id === school)
    if (!picked) {
      setError('Please select your school from the list.')
      return
    }
    setLoading(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name.trim(),
        phone: user.phoneNumber || '',
        school: formatSchoolProfile(picked),
        joinedAt: serverTimestamp(),
        isAdmin: false,
        isBlocked: false,
        activeListingCount: 0,
      })
      navigate('/', { replace: true })
    } catch {
      setError('Could not save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-10 max-w-[430px] mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-1">Welcome!</h1>
      <p className="text-primary/60 text-sm mb-6">
        Tell us a bit about yourself to get started.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-primary">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ayesha Khan"
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
          />
        </label>

        {schoolsLoading ? (
          <p className="text-sm text-primary/50">Loading schools…</p>
        ) : schoolsError ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {schoolsError}
          </div>
        ) : schools.length === 0 ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 leading-relaxed">
            <p className="font-medium mb-1">No schools available yet</p>
            <p>
              Your school must be added by the app admin before you can sign up.
              Please contact the admin through your school WhatsApp group.
            </p>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-primary">School</span>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
            >
              <option value="">Select your school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSchoolLabel(s)}
                </option>
              ))}
            </select>
            <p className="text-xs text-primary/50 mt-2 leading-relaxed">
              Don&apos;t see your school? Contact the app admin to have it added — you cannot
              enter a school name manually.
            </p>
          </label>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || schoolsLoading || !canContinue}
          className="w-full py-3 rounded-lg bg-accent text-primary font-bold disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}

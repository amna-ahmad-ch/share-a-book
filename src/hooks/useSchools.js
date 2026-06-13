import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { parseSchoolDoc } from '../utils/school'

export function useSchools() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

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
        setError(
          err?.code === 'permission-denied'
            ? 'Could not load schools. Please try again later.'
            : 'Could not load schools. Please refresh and try again.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { schools, loading, error }
}

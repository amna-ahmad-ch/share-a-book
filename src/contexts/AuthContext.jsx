import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = null
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }
      if (firebaseUser) {
        unsubProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => setProfile(snap.exists() ? { uid: snap.id, ...snap.data() } : null),
          () => setProfile(null),
        )
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const refreshProfile = () => {
    /* onSnapshot keeps profile live */
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function AboutPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, free: 0 })
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'listings'), where('isActive', '==', true))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => d.data())
      setStats({
        total: items.length,
        free: items.filter((l) => l.type === 'free').length,
      })
    })
    return unsub
  }, [user])

  return (
    <div className="space-y-6 pb-4">
      <section className="text-center pt-2">
        <span className="text-5xl block mb-2">📚</span>
        <h1 className="text-2xl font-bold text-primary">Share a Book</h1>
        <p className="text-accent font-medium">Free School Book Exchange</p>
      </section>

      <section className="rounded-xl bg-white p-4 border border-primary/5">
        <h2 className="font-bold text-primary mb-2">The Problem</h2>
        <p className="text-sm text-primary/70 leading-relaxed">
          School WhatsApp groups are chaotic for book exchanges. Requests and offers get
          buried under hundreds of unrelated messages. The same
          requests repeat every term, and there is no way to filter by grade or subject.
        </p>
      </section>

      <section className="rounded-xl bg-white p-4 border border-primary/5">
        <h2 className="font-bold text-primary mb-2">The Solution</h2>
        <p className="text-sm text-primary/70 leading-relaxed">
          Share a Book gives parents a clean place to browse books by grade and subject,
          see photos, and contact donors or sellers with one tap on WhatsApp. All free,
          no app install required.
        </p>
      </section>

      <div className="rounded-xl bg-free text-white text-center py-3 px-4 font-semibold">
        100% Free to Use, no subscriptions, no hidden fees.
      </div>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-3 border border-primary/5">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-[10px] text-primary/50 uppercase">Books listed</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-primary/5">
          <p className="text-2xl font-bold text-free">{stats.free}</p>
          <p className="text-[10px] text-primary/50 uppercase">Free books</p>
        </div>
        <div className="rounded-xl bg-white p-3 border border-primary/5">
          <p className="text-2xl font-bold text-accent">Rs 0</p>
          <p className="text-[10px] text-primary/50 uppercase">Cost to use</p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 border border-primary/5 text-center">
        <p className="text-sm text-primary/70 leading-relaxed mb-3">
          This app is built by a school parent, for school parents. If it helped you,
          consider buying me a chai.
        </p>
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="px-6 py-2 rounded-lg bg-accent text-primary font-bold text-sm"
        >
          Support via Easypaisa
        </button>
      </section>

      <p className="text-center text-xs text-primary/40 pb-2">
        Made with love by a school parent
      </p>

      {!user && (
        <Link
          to="/login"
          className="block text-center py-3 rounded-lg bg-primary text-white font-semibold"
        >
          Sign in to browse & post
        </Link>
      )}

      {showQr && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowQr(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowQr(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-primary mb-3">Easypaisa</h3>
            <img
              src="/easypaisa-qr.png"
              alt="Easypaisa QR code"
              className="w-full rounded-lg border border-primary/10"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling?.classList.remove('hidden')
              }}
            />
            <p className="hidden text-sm text-primary/50 mt-2">
              Add your QR image at public/easypaisa-qr.png
            </p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-4 text-sm text-primary/60"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

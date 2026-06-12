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
import {
  SUPPORT_TOPICS,
  buildSupportWhatsAppUrl,
  submitSupportMessage,
  supportWhatsAppConfigured,
} from '../utils/support'

export default function AboutPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, free: 0 })
  const [topic, setTopic] = useState('general')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSent, setFormSent] = useState(false)

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

  async function handleSupportSubmit(e) {
    e.preventDefault()
    if (!user) return
    setFormError('')
    setFormLoading(true)
    try {
      await submitSupportMessage({ user, profile, topic, message })
      setMessage('')
      setTopic('general')
      setFormSent(true)
    } catch (err) {
      setFormError(err.message || 'Could not send message. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const whatsAppUrl = supportWhatsAppConfigured()
    ? buildSupportWhatsAppUrl(profile)
    : null

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

      <section className="rounded-xl bg-white p-4 border border-primary/5 space-y-4">
        <div>
          <h2 className="font-bold text-primary mb-1">Need help?</h2>
          <p className="text-sm text-primary/70 leading-relaxed">
            Questions, missing school, or something not working — reach out below.
          </p>
        </div>

        {whatsAppUrl && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-whatsapp text-white font-semibold text-sm"
          >
            Message on WhatsApp
          </a>
        )}

        {user ? (
          formSent ? (
            <div className="rounded-lg bg-free/10 border border-free/30 px-3 py-3 text-sm text-primary text-center">
              Message sent — we&apos;ll get back to you soon.
              <button
                type="button"
                onClick={() => setFormSent(false)}
                className="block mx-auto mt-2 text-xs text-primary/60 underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">
                Or send a message
              </p>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-primary/15 text-sm bg-white text-primary"
              >
                {SUPPORT_TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue…"
                rows={4}
                maxLength={1000}
                required
                className="w-full px-3 py-2 rounded-lg border border-primary/15 text-sm resize-none"
              />
              {formError && <p className="text-red-600 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={formLoading || !message.trim()}
                className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {formLoading ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )
        ) : (
          <p className="text-sm text-primary/60 text-center">
            <Link to="/login" className="text-accent font-medium">Sign in</Link>
            {' '}to send a message through the app.
          </p>
        )}
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

    </div>
  )
}

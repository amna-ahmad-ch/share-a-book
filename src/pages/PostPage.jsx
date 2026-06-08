import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import {
  CATEGORIES,
  CONDITIONS,
  GRADES,
  MAX_LISTINGS,
} from '../constants'
import PhotoPicker from '../components/PhotoPicker'

export default function PostPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processedPhoto, setProcessedPhoto] = useState(null)
  const [form, setForm] = useState({
    title: '',
    grade: '',
    category: '',
    condition: 'Good',
    type: 'free',
    price: '',
  })

  const count = profile?.activeListingCount ?? 0
  const atLimit = count >= MAX_LISTINGS

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError('Book title is required.')
      return
    }
    if (!form.grade || !form.category) {
      setError('Please select grade and subject.')
      return
    }
    if (form.type === 'sell' && (!form.price || Number(form.price) <= 0)) {
      setError('Enter a valid price in PKR.')
      return
    }
    setLoading(true)
    try {
      let imageUrl = null
      if (processedPhoto) {
        const path = `listings/${user.uid}/${Date.now()}_${processedPhoto.name}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, processedPhoto, {
          contentType: processedPhoto.type || 'image/jpeg',
        })
        imageUrl = await getDownloadURL(storageRef)
      }

      await addDoc(collection(db, 'listings'), {
        title: form.title.trim(),
        grade: form.grade,
        category: form.category,
        condition: form.condition,
        type: form.type,
        price: form.type === 'sell' ? Number(form.price) : null,
        imageUrl,
        postedBy: profile.name,
        postedByUid: user.uid,
        postedByPhone: profile.phone || user.phoneNumber,
        school: profile.school,
        createdAt: serverTimestamp(),
        isActive: true,
      })

      await updateDoc(doc(db, 'users', user.uid), {
        activeListingCount: increment(1),
      })

      setSuccess(true)
    } catch (err) {
      console.error('Post failed:', err)
      const code = err?.code || ''
      if (code.startsWith('storage/')) {
        setError(
          'Photo upload failed. Enable Firebase Storage in the console and publish storage rules, or post without a photo.',
        )
      } else {
        setError('Could not post listing. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (atLimit) {
    return (
      <div className="text-center py-8 space-y-4">
        <span className="text-4xl block">📚</span>
        <h2 className="text-lg font-bold text-primary">Listing limit reached</h2>
        <p className="text-primary/60 text-sm">
          You have reached your {MAX_LISTINGS} listing limit. Please delete an old
          listing to post a new one.
        </p>
        <p className="text-sm font-medium text-primary">{count} of {MAX_LISTINGS} listings used</p>
        <Link
          to="/my-books"
          className="inline-block px-6 py-3 rounded-lg bg-accent text-primary font-bold"
        >
          Go to My Books
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <span className="text-5xl block">✅</span>
        <h2 className="text-lg font-bold text-primary">Book posted!</h2>
        <p className="text-primary/60 text-sm">Your listing is now live for other parents.</p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="py-3 rounded-lg bg-primary text-white font-semibold"
          >
            Browse listings
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccess(false)
              setProcessedPhoto(null)
              setForm({
                title: '',
                grade: '',
                category: '',
                condition: 'Good',
                type: 'free',
                price: '',
              })
            }}
            className="py-3 rounded-lg border border-primary/20 text-primary font-medium"
          >
            Post another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-primary">Post a Book</h1>
        <p className="text-sm text-primary/50">{count} of {MAX_LISTINGS} listings used</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-primary">Book title *</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
            placeholder="e.g. Oxford Mathematics Grade 5"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-primary">Grade *</span>
          <select
            value={form.grade}
            onChange={(e) => update('grade', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
          >
            <option value="">Select grade</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-primary">Subject *</span>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
          >
            <option value="">Select subject</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-sm font-medium text-primary">Condition *</span>
          <div className="flex gap-2 mt-1">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update('condition', c)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  form.condition === c
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-primary/20 text-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-primary">Listing type *</span>
          <div className="flex gap-2 mt-1">
            {[
              { value: 'free', label: 'Donate Free' },
              { value: 'sell', label: 'Sell' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update('type', t.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  form.type === t.value
                    ? 'bg-accent text-primary border-accent'
                    : 'bg-white border-primary/20 text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {form.type === 'sell' && (
          <label className="block">
            <span className="text-sm font-medium text-primary">Price (PKR) *</span>
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
              placeholder="500"
            />
          </label>
        )}

        <PhotoPicker onReady={setProcessedPhoto} disabled={loading} />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Posting…' : 'Post Book'}
        </button>
      </form>
    </div>
  )
}

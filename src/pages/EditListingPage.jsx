import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import PhotoPicker from '../components/PhotoPicker'
import {
  CATEGORIES,
  CONDITIONS,
  GRADES,
  MAX_LISTING_TITLE,
} from '../constants'
import { deleteListingImage } from '../utils/listingStorage'

export default function EditListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [listing, setListing] = useState(null)
  const [loadingListing, setLoadingListing] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processedPhoto, setProcessedPhoto] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [form, setForm] = useState({
    title: '',
    grade: '',
    category: '',
    condition: 'Good',
    type: 'free',
    price: '',
  })

  useEffect(() => {
    getDoc(doc(db, 'listings', id))
      .then((snap) => {
        if (!snap.exists()) {
          setLoadError('This listing was not found.')
          return
        }
        const data = { id: snap.id, ...snap.data() }
        if (!data.isActive) {
          setLoadError('This listing is no longer active.')
          return
        }
        if (data.postedByUid !== user?.uid) {
          setLoadError('You can only edit your own listings.')
          return
        }
        setListing(data)
        setForm({
          title: data.title || '',
          grade: data.grade || '',
          category: data.category || '',
          condition: data.condition || 'Good',
          type: data.type || 'free',
          price: data.price != null ? String(data.price) : '',
        })
      })
      .catch(() => setLoadError('Could not load this listing.'))
      .finally(() => setLoadingListing(false))
  }, [id, user?.uid])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function onPhotoReady(file) {
    setProcessedPhoto(file)
    if (file) setRemovePhoto(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!listing) return
    setError('')

    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) {
      setError('Book title is required.')
      return
    }
    if (trimmedTitle.length > MAX_LISTING_TITLE) {
      setError(`Title must be ${MAX_LISTING_TITLE} characters or fewer.`)
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
      let imageUrl = listing.imageUrl ?? null
      let imagePath = listing.imagePath ?? null

      if (removePhoto && (listing.imageUrl || listing.imagePath)) {
        await deleteListingImage(listing)
        imageUrl = null
        imagePath = null
      } else if (processedPhoto) {
        if (listing.imageUrl || listing.imagePath) {
          await deleteListingImage(listing)
        }
        imagePath = `listings/${user.uid}/${Date.now()}_${processedPhoto.name}`
        const storageRef = ref(storage, imagePath)
        await uploadBytes(storageRef, processedPhoto, {
          contentType: processedPhoto.type || 'image/jpeg',
        })
        imageUrl = await getDownloadURL(storageRef)
      }

      await updateDoc(doc(db, 'listings', listing.id), {
        title: trimmedTitle,
        grade: form.grade,
        category: form.category,
        condition: form.condition,
        type: form.type,
        price: form.type === 'sell' ? Number(form.price) : null,
        imageUrl,
        imagePath,
        postedBy: profile?.name || listing.postedBy,
        school: profile?.school || listing.school,
      })

      navigate('/my-books', { replace: true })
    } catch (err) {
      console.error('Listing update failed:', err)
      const code = err?.code || ''
      if (code.startsWith('storage/')) {
        setError('Photo upload failed. Try again or save without changing the photo.')
      } else {
        setError('Could not save changes. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingListing) {
    return <div className="text-primary/50 animate-pulse py-12 text-center">Loading…</div>
  }

  if (loadError) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-primary/60">{loadError}</p>
        <Link to="/my-books" className="text-accent font-medium">Back to My Books</Link>
      </div>
    )
  }

  const showExistingPhoto = listing?.imageUrl && !processedPhoto && !removePhoto

  return (
    <div className="space-y-4">
      <Link to="/my-books" className="text-sm text-accent font-medium inline-block">
        ← Back to My Books
      </Link>

      <header>
        <h1 className="text-xl font-bold text-primary">Edit listing</h1>
        <p className="text-sm text-primary/50 mt-1">Update your book details or photo.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-primary">Book title *</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={MAX_LISTING_TITLE}
            className="mt-1 w-full px-4 py-3 rounded-lg border border-primary/20 bg-white"
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
            />
          </label>
        )}

        {showExistingPhoto && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-primary">Current photo</span>
            <div className="rounded-xl border border-primary/15 overflow-hidden bg-white">
              <img
                src={listing.imageUrl}
                alt=""
                className="w-full aspect-[4/3] object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemovePhoto(true)}
              className="text-xs text-red-500 font-medium"
            >
              Remove photo
            </button>
          </div>
        )}

        {removePhoto && !processedPhoto && (
          <p className="text-xs text-primary/50">Photo will be removed when you save.</p>
        )}

        <PhotoPicker
          onReady={onPhotoReady}
          disabled={loading}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { daysSinceLabel } from '../utils/dates'
import { MAX_LISTING_TITLE, MAX_NAME_LENGTH } from '../constants'
import { buildWhatsAppUrl, contactMessage } from '../utils/whatsapp'

export default function ListingDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showContact, setShowContact] = useState(false)
  const [showReportConfirm, setShowReportConfirm] = useState(false)
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState('')

  const isOwnListing = user?.uid === listing?.postedByUid

  useEffect(() => {
    getDoc(doc(db, 'listings', id)).then((snap) => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    getDoc(doc(db, 'reports', `${id}_${user.uid}`)).then((snap) => {
      setReported(snap.exists() && snap.data()?.status === 'pending')
    })
  }, [user, id])

  async function submitReport() {
    if (!user || !profile || !listing) return
    if (!listing.postedByUid) {
      setReportError('This listing cannot be reported right now.')
      return
    }
    if (listing.postedByUid === user.uid) {
      setReportError('You cannot report your own listing.')
      return
    }
    const listingTitle = (listing.title || '').slice(0, MAX_LISTING_TITLE)
    const reportedByName = (profile.name || '').trim().slice(0, MAX_NAME_LENGTH)
    if (!reportedByName) {
      setReportError('Your profile name is required to send a report.')
      return
    }
    setReporting(true)
    setReportError('')
    try {
      await setDoc(
        doc(db, 'reports', `${listing.id}_${user.uid}`),
        {
          listingId: listing.id,
          listingTitle,
          posterName: listing.postedBy,
          posterUid: listing.postedByUid,
          reportedByName,
          reportedByUid: user.uid,
          status: 'pending',
          createdAt: serverTimestamp(),
        },
        { merge: true },
      )
      setReported(true)
      setShowReportConfirm(false)
    } catch (err) {
      console.error('Report failed:', err)
      if (err?.code === 'permission-denied') {
        setReportError(
          'Report blocked by Firestore rules. Publish the latest rules from firestore.rules in Firebase Console.',
        )
      } else {
        setReportError('Could not send report. Please try again.')
      }
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return <div className="text-primary/50 animate-pulse py-12 text-center">Loading…</div>
  }

  if (!listing || !listing.isActive) {
    return (
      <div className="text-center py-12">
        <p className="text-primary/60 mb-4">This listing is no longer available.</p>
        <Link to="/" className="text-accent font-medium">Back to browse</Link>
      </div>
    )
  }

  const isFree = listing.type === 'free'
  const waUrl = listing.postedByPhone
    ? buildWhatsAppUrl(
        listing.postedByPhone,
        contactMessage(listing.postedBy, listing.title, listing.grade),
      )
    : null

  return (
    <div className="space-y-4 -mt-2">
      <Link to="/" className="text-sm text-accent font-medium">← Back</Link>

      <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-white border border-primary/10 flex items-center justify-center">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-7xl">📚</span>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-primary">{listing.title}</h1>
          <span
            className={`shrink-0 text-sm font-bold px-3 py-1 rounded-lg ${
              isFree ? 'bg-free text-white' : 'bg-accent text-primary'
            }`}
          >
            {isFree ? 'FREE' : `Rs ${listing.price}`}
          </span>
        </div>
        <p className="text-primary/60 mt-1">{listing.grade} · {listing.category}</p>
        <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-primary/5 text-primary/70">
          Condition: {listing.condition}
        </span>
      </div>

      <div className="rounded-xl bg-white p-4 border border-primary/5">
        <p className="text-sm text-primary/50">Posted by</p>
        <p className="font-medium text-primary">{listing.postedBy}</p>
        <p className="text-xs text-primary/40 mt-1">{daysSinceLabel(listing.createdAt)}</p>
        {listing.school && (
          <p className="text-xs text-primary/40 mt-0.5">{listing.school}</p>
        )}
      </div>

      {!showContact ? (
        <button
          type="button"
          onClick={() => setShowContact(true)}
          className="w-full py-3 rounded-xl bg-whatsapp text-white font-semibold flex items-center justify-center gap-2"
        >
          Contact on WhatsApp
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-primary/60 bg-primary/5 rounded-lg p-3 leading-relaxed">
            Contacting via WhatsApp will share your phone number with this parent.
            This is a trusted school community.
          </p>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-whatsapp text-white font-semibold text-center"
            >
              Open WhatsApp
            </a>
          ) : (
            <p className="text-red-600 text-sm text-center">Contact unavailable for this listing.</p>
          )}
        </div>
      )}

      {!isOwnListing && (
        <div className="pt-2 border-t border-primary/10">
          {reported ? (
            <p className="text-xs text-center text-primary/50">
              Thanks — this listing has been reported. An admin will review it.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowReportConfirm(true)}
                className="w-full text-sm text-primary/40 hover:text-red-500 transition-colors py-2"
              >
                Report listing
              </button>
              {reportError && (
                <p className="text-red-600 text-xs text-center mt-1">{reportError}</p>
              )}
            </>
          )}
        </div>
      )}

      {showReportConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-primary mb-2">Report this listing?</h3>
            <p className="text-sm text-primary/60 mb-4 leading-relaxed">
              Use this if the photo or content is not a school book, or seems inappropriate.
              An admin will review and may remove it.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReportConfirm(false)}
                disabled={reporting}
                className="flex-1 py-2 rounded-lg border border-primary/20 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={reporting}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm"
              >
                {reporting ? 'Sending…' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { doc, updateDoc } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../firebase'

function pathFromDownloadUrl(imageUrl) {
  try {
    const url = new URL(imageUrl)
    const match = url.pathname.match(/\/o\/(.+)$/)
    if (!match) return null
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

function imageRefForListing({ imagePath, imageUrl }) {
  if (imagePath) return ref(storage, imagePath)
  const path = pathFromDownloadUrl(imageUrl)
  return path ? ref(storage, path) : null
}

export async function deleteListingImage(listing) {
  const imageRef = imageRefForListing(listing)
  if (!imageRef) return
  try {
    await deleteObject(imageRef)
  } catch (err) {
    if (err?.code === 'storage/object-not-found') return
    throw err
  }
}

/** Soft-delete listing and remove its image from Storage. */
export async function deactivateListing(listingId, listing) {
  if (listing?.imageUrl || listing?.imagePath) {
    await deleteListingImage(listing)
  }
  await updateDoc(doc(db, 'listings', listingId), {
    isActive: false,
    imageUrl: null,
    imagePath: null,
  })
}

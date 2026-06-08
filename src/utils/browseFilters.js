import { CATEGORIES, GRADES, LISTING_TYPES } from '../constants'

const STORAGE_PREFIX = 'share-a-book-browse-filters'

const VALID_TYPES = new Set(LISTING_TYPES.map((t) => t.value))

function storageKey(uid) {
  return uid ? `${STORAGE_PREFIX}:${uid}` : STORAGE_PREFIX
}

export function loadBrowseFilters(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return { grade: '', category: '', type: 'all' }

    const parsed = JSON.parse(raw)
    return {
      grade: GRADES.includes(parsed.grade) ? parsed.grade : '',
      category: CATEGORIES.includes(parsed.category) ? parsed.category : '',
      type: VALID_TYPES.has(parsed.type) ? parsed.type : 'all',
    }
  } catch {
    return { grade: '', category: '', type: 'all' }
  }
}

export function saveBrowseFilters(uid, { grade, category, type }) {
  try {
    localStorage.setItem(
      storageKey(uid),
      JSON.stringify({ grade, category, type }),
    )
  } catch {
    /* private mode or quota — filters still work for this session */
  }
}

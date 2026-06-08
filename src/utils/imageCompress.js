import imageCompression from 'browser-image-compression'

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])
const HEIC_EXT = /\.hei[cf]$/i

function isIosOrSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Safari') && !ua.includes('Chrome'))
}

export function isHeicFile(file) {
  if (!file) return false
  const type = (file.type || '').toLowerCase()
  if (HEIC_TYPES.has(type)) return true
  return HEIC_EXT.test(file.name || '')
}

function isImageFile(file) {
  if (!file) return false
  const type = (file.type || '').toLowerCase()
  if (type.startsWith('image/')) return true
  if (HEIC_EXT.test(file.name || '')) return true
  // iOS sometimes uses empty type or octet-stream for photos
  if (!type || type === 'application/octet-stream') {
    return /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name || '')
  }
  return false
}

async function heicViaHeic2any(file) {
  const blob = file.type ? file : new Blob([file], { type: 'image/heic' })
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob,
    toType: 'image/jpeg',
    quality: 0.92,
  })
  const result = Array.isArray(converted) ? converted[0] : converted
  const baseName = (file.name || 'photo').replace(HEIC_EXT, '')
  return new File([result], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

/** Safari on iOS can decode HEIC in an img element — fallback when heic2any fails. */
async function heicViaCanvas(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not decode image'))
      el.src = url
    })
    const max = 1200
    let { width, height } = img
    if (width > max || height > max) {
      const scale = max / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/jpeg', 0.92)
    })
    const baseName = (file.name || 'photo').replace(HEIC_EXT, '').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName || 'photo'}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function normalizeToJpeg(file) {
  if (!isHeicFile(file)) {
    return file
  }

  try {
    return await heicViaHeic2any(file)
  } catch (err) {
    console.warn('heic2any failed, trying canvas fallback:', err)
    return heicViaCanvas(file)
  }
}

async function runCompression(file, useWebWorker) {
  const keepPng = !isHeicFile(file) && file.type === 'image/png'
  return imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker,
    fileType: keepPng ? 'image/png' : 'image/jpeg',
  })
}

export async function compressImage(file) {
  const normalized = await normalizeToJpeg(file)
  const preferWorker = !isIosOrSafari()

  let compressed
  try {
    compressed = await runCompression(normalized, preferWorker)
  } catch {
    compressed = await runCompression(normalized, false)
  }

  const keepPng = !isHeicFile(file) && normalized.type === 'image/png'
  if (!keepPng && compressed.type !== 'image/jpeg') {
    const name = (compressed.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg'
    return new File([compressed], name, { type: 'image/jpeg', lastModified: Date.now() })
  }

  return compressed
}

/** HEIC → JPEG (if needed) → compress under 300KB. */
export async function prepareImageForUpload(file) {
  if (!file) throw new Error('No file selected')
  if (!isImageFile(file)) {
    throw new Error('Please choose a photo (JPG, PNG, or iPhone HEIC).')
  }
  return compressImage(file)
}

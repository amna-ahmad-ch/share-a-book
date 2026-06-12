import imageCompression from 'browser-image-compression'

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])
const HEIC_EXT = /\.hei[cf]$/i
const MAX_INPUT_MB = 20
const TARGET_BYTES = 300 * 1024
const ANDROID_MAX_DIM = 960
const MOBILE_MAX_DIM = 1100

function isIosOrSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Safari') && !ua.includes('Chrome'))
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
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
  if (!type || type === 'application/octet-stream') {
    return /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name || '')
  }
  return false
}

function jpegFileName(file) {
  const baseName = (file.name || 'photo').replace(HEIC_EXT, '').replace(/\.[^.]+$/, '')
  return `${baseName || 'photo'}.jpg`
}

function releaseImage(img) {
  if (img) {
    img.onload = null
    img.onerror = null
    img.src = ''
  }
}

function releaseCanvas(canvas) {
  if (canvas) {
    canvas.width = 0
    canvas.height = 0
  }
}

async function heicViaHeic2any(file) {
  const blob = file.type ? file : new Blob([file], { type: 'image/heic' })
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob,
    toType: 'image/jpeg',
    quality: 0.85,
  })
  const result = Array.isArray(converted) ? converted[0] : converted
  return new File([result], jpegFileName(file), { type: 'image/jpeg', lastModified: Date.now() })
}

async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not decode image'))
      el.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function rasterizeToJpeg(file, maxDim, quality = 0.82) {
  const img = await loadImageFromFile(file)
  try {
    let { width, height } = img
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
        'image/jpeg',
        quality,
      )
    })
    releaseCanvas(canvas)
    return new File([blob], jpegFileName(file), { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    releaseImage(img)
  }
}

async function shrinkToTarget(file, targetBytes = TARGET_BYTES) {
  let maxDim = isAndroid() ? ANDROID_MAX_DIM : MOBILE_MAX_DIM
  let quality = 0.82
  let result = await rasterizeToJpeg(file, maxDim, quality)

  for (let attempt = 0; attempt < 10 && result.size > targetBytes; attempt += 1) {
    if (quality > 0.45) {
      quality -= 0.08
      result = await rasterizeToJpeg(result, maxDim, quality)
    } else {
      maxDim = Math.max(640, Math.round(maxDim * 0.85))
      quality = 0.72
      result = await rasterizeToJpeg(result, maxDim, quality)
    }
  }

  if (result.size > targetBytes * 1.6) {
    throw new Error('Photo is too large. Try a smaller image or post without a photo.')
  }

  return result
}

async function normalizeHeic(file) {
  if (isIosOrSafari()) {
    try {
      return await rasterizeToJpeg(file, MOBILE_MAX_DIM, 0.82)
    } catch (err) {
      console.warn('iOS canvas HEIC failed, trying heic2any:', err)
      return heicViaHeic2any(file)
    }
  }

  try {
    return await heicViaHeic2any(file)
  } catch (err) {
    console.warn('heic2any failed, trying canvas:', err)
    return rasterizeToJpeg(file, ANDROID_MAX_DIM, 0.82)
  }
}

/** Canvas path for gallery picks on mobile. */
async function compressMobile(file) {
  let working = file
  if (isHeicFile(file)) {
    working = await normalizeHeic(file)
  }
  return shrinkToTarget(working)
}

/** Large / camera photos on Android — library compression avoids canvas OOM. */
async function compressAndroidHeavy(file) {
  let working = file
  if (isHeicFile(file)) {
    working = await normalizeHeic(file)
  }
  const compressed = await imageCompression(working, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 960,
    useWebWorker: false,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
  })
  return new File([compressed], jpegFileName(file), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

async function runDesktopCompression(file) {
  const keepPng = !isHeicFile(file) && file.type === 'image/png'
  let normalized = file
  if (isHeicFile(file)) {
    normalized = await normalizeHeic(file)
  }
  const compressed = await imageCompression(normalized, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: false,
    fileType: keepPng ? 'image/png' : 'image/jpeg',
  })
  if (!keepPng && compressed.type !== 'image/jpeg') {
    return new File([compressed], jpegFileName(compressed), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  }
  return compressed
}

export function inferHeavyPhoto(file, { pageLeft = false } = {}) {
  if (!isAndroid() || !file) return Boolean(pageLeft)
  if (pageLeft) return true
  if (file.size >= 1.2 * 1024 * 1024) return true
  const name = (file.name || '').toLowerCase()
  if (/^img_|^pxl_|^dsc|^camera|^\d{8}_\d{6}|^mvimg_/.test(name)) return true
  return false
}

export async function compressImage(file, { pageLeft = false } = {}) {
  if (isMobileDevice()) {
    if (inferHeavyPhoto(file, { pageLeft })) {
      return compressAndroidHeavy(file)
    }
    return compressMobile(file)
  }
  return runDesktopCompression(file)
}

async function readFileBuffer(file) {
  try {
    return await file.arrayBuffer()
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error || new Error('Could not read photo'))
      reader.readAsArrayBuffer(file)
    })
  }
}

/** Copy file bytes so Android does not lose the reference after the picker closes. */
export async function snapshotImageFile(file) {
  if (!file?.size) {
    throw new Error('Photo file is empty — try again.')
  }
  const buffer = await readFileBuffer(file)
  if (!buffer.byteLength) {
    throw new Error('Could not read photo data — try again.')
  }
  const type = file.type && (file.type.startsWith('image/') || isHeicFile(file))
    ? file.type
    : 'image/jpeg'
  const name = file.name || 'photo.jpg'
  return new File([buffer], name, { type, lastModified: file.lastModified || Date.now() })
}

export async function prepareImageForUpload(file, { pageLeft = false } = {}) {
  if (!file) throw new Error('No file selected')
  if (!isImageFile(file)) {
    throw new Error('Please choose a photo (JPG, PNG, or iPhone HEIC).')
  }
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`Photo is too large. Please pick one under ${MAX_INPUT_MB}MB.`)
  }
  return compressImage(file, { pageLeft })
}

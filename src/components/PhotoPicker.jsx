import { useEffect, useRef, useState } from 'react'
import { prepareImageForUpload } from '../utils/imageCompress'

export default function PhotoPicker({ onReady, disabled }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleFile(file) {
    if (!file) {
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setFileName('')
      setError('')
      onReady(null)
      return
    }

    setProcessing(true)
    setError('')
    try {
      const compressed = await prepareImageForUpload(file)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(compressed))
      setFileName(compressed.name)
      onReady(compressed)
    } catch (err) {
      console.error('Photo processing failed:', err)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setFileName('')
      onReady(null)
      setError('Could not use this photo. Try another, or post without one.')
    } finally {
      setProcessing(false)
    }
  }

  function clearPhoto(e) {
    e.stopPropagation()
    if (inputRef.current) inputRef.current.value = ''
    handleFile(null)
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-primary">Photo (optional)</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        disabled={disabled || processing}
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        disabled={disabled || processing}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border-2 border-dashed border-primary/25 bg-white overflow-hidden transition-colors hover:border-accent hover:bg-accent/5 active:scale-[0.99] disabled:opacity-50"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Book preview" className="w-full aspect-[4/3] object-contain bg-white" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
              <p className="text-white text-xs font-medium truncate">{fileName}</p>
              <p className="text-white/80 text-[10px]">Tap to change photo</p>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 flex flex-col items-center gap-2 text-primary/60">
            <span className="text-4xl leading-none" aria-hidden>📷</span>
            <span className="font-semibold text-primary text-sm">
              {processing ? 'Processing photo…' : 'Tap to add a photo'}
            </span>
            <span className="text-xs text-center leading-relaxed">
              Camera or photo library · JPG, PNG, iPhone HEIC
            </span>
          </div>
        )}
      </button>
      {preview && !processing && (
        <button
          type="button"
          onClick={clearPhoto}
          className="text-xs text-red-500 font-medium"
        >
          Remove photo
        </button>
      )}
      {error && <p className="text-red-600 text-xs leading-relaxed">{error}</p>}
      {!error && !preview && (
        <p className="text-xs text-primary/40">Compressed under 300KB before upload</p>
      )}
    </div>
  )
}

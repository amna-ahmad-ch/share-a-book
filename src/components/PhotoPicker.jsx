import { useEffect, useRef, useState } from 'react'
import CameraCapture from './CameraCapture'
import { inferHeavyPhoto, prepareImageForUpload, snapshotImageFile } from '../utils/imageCompress'

export default function PhotoPicker({ onReady, disabled }) {
  const inputRef = useRef(null)
  const previewRef = useRef(null)
  const busyRef = useRef(false)

  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function revokePreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    setPreview(null)
  }

  function clearInput() {
    if (inputRef.current) inputRef.current.value = ''
  }

  async function processFile(file) {
    if (!file) {
      revokePreview()
      setFileName('')
      setError('')
      onReady(null)
      return
    }

    if (busyRef.current) return
    busyRef.current = true
    setProcessing(true)
    setError('')

    try {
      const heavy = inferHeavyPhoto(file, { pageLeft: file.name === 'camera.jpg' })
      const compressed = await prepareImageForUpload(file, { pageLeft: heavy })
      revokePreview()
      const url = URL.createObjectURL(compressed)
      previewRef.current = url
      setPreview(url)
      setFileName(compressed.name)
      onReady(compressed)
    } catch (err) {
      console.error('Photo processing failed:', err)
      revokePreview()
      setFileName('')
      onReady(null)
      setError(err?.message || 'Could not use this photo. Try a smaller image, or post without one.')
    } finally {
      setProcessing(false)
      busyRef.current = false
    }
  }

  async function onFileInputChange() {
    const file = inputRef.current?.files?.[0]
    if (!file) return

    clearInput()
    try {
      const snapshot = await snapshotImageFile(file)
      await processFile(snapshot)
    } catch (err) {
      console.error('Gallery pick failed:', err)
      setError(err?.message || 'Could not read this photo. Please try again.')
      busyRef.current = false
      setProcessing(false)
    }
  }

  async function onCameraCapture(file) {
    setShowCamera(false)
    await processFile(file)
  }

  function openGallery() {
    if (busyRef.current || disabled || processing) return
    inputRef.current?.click()
  }

  function openCamera() {
    if (busyRef.current || disabled || processing) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported here. Use photo album instead.')
      return
    }
    setShowCamera(true)
  }

  function clearPhoto(e) {
    e.stopPropagation()
    busyRef.current = false
    clearInput()
    processFile(null)
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
        onChange={onFileInputChange}
      />

      {preview ? (
        <div className="rounded-xl border-2 border-primary/15 bg-white overflow-hidden">
          <img src={preview} alt="Book preview" className="w-full aspect-[4/3] object-contain bg-white" />
          <div className="px-3 py-2 border-t border-primary/10 bg-primary/[0.03]">
            <p className="text-xs font-medium text-primary truncate">{fileName}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-primary/25 bg-white p-4 space-y-3">
          <div className="text-center text-primary/60">
            <span className="text-4xl leading-none block mb-2" aria-hidden>📷</span>
            {processing ? (
              <>
                <p className="font-semibold text-primary text-sm">Preparing photo…</p>
                <p className="text-xs text-primary/50 mt-1">Keep this screen open</p>
              </>
            ) : (
              <p className="font-semibold text-primary text-sm">Add a book photo</p>
            )}
          </div>
          {!processing && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={openCamera}
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                Take photo
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={openGallery}
                className="flex-1 py-2.5 rounded-lg border border-primary/20 text-primary text-sm font-semibold disabled:opacity-50"
              >
                Photo album
              </button>
            </div>
          )}
        </div>
      )}

      {preview && !processing && (
        <div className="flex gap-3">
          <button type="button" onClick={openCamera} className="text-xs text-primary/60 font-medium">
            Retake
          </button>
          <button type="button" onClick={openGallery} className="text-xs text-primary/60 font-medium">
            Change
          </button>
          <button type="button" onClick={clearPhoto} className="text-xs text-red-500 font-medium ml-auto">
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-xs leading-relaxed">{error}</p>}
      {!error && !preview && !processing && (
        <p className="text-xs text-primary/40">Compressed under 300KB before upload</p>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={onCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}

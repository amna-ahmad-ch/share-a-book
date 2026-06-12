import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    startCamera()

    return () => {
      stopCamera()
      document.body.style.overflow = ''
    }
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setReady(true)
    } catch (err) {
      console.error('Camera failed:', err)
      setError('Camera access denied or not available on this device.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  function close() {
    stopCamera()
    onClose?.()
  }

  function takePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const maxDim = 1200
    let { videoWidth: width, videoHeight: height } = video
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture photo. Try again.')
          return
        }
        const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' })
        onCapture(file)
        stopCamera()
      },
      'image/jpeg',
      0.85,
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-primary/90">
        <p className="text-white text-sm font-semibold">Take book photo</p>
        <button
          type="button"
          onClick={close}
          className="text-white/80 text-sm font-medium px-2 py-1"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        {error ? (
          <div className="text-center space-y-4 px-4">
            <p className="text-white text-sm leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 rounded-lg bg-white text-primary font-semibold text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[65vh] object-contain rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" aria-hidden />
          </>
        )}
      </div>

      {!error && (
        <div className="p-4 pb-8 flex justify-center">
          <button
            type="button"
            onClick={takePhoto}
            disabled={!ready}
            className="w-16 h-16 rounded-full bg-white border-4 border-accent disabled:opacity-40"
            aria-label="Capture photo"
          />
        </div>
      )}
    </div>,
    document.body,
  )
}

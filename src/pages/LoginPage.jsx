import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'
import { auth } from '../firebase'
import { toE164Pakistan, formatPhoneDisplay } from '../utils/phone'

function mapAuthError(err) {
  const code = err?.code || ''
  const host = window.location.hostname

  if (code === 'auth/invalid-app-credential' || code === 'auth/app-not-authorized') {
    if (host === 'localhost') {
      return (
        'Phone login does not work on localhost. Open the app at http://127.0.0.1:5173 ' +
        'instead, and add 127.0.0.1 under Firebase → Authentication → Settings → Authorized domains.'
      )
    }
    return (
      'Security check failed. Add this site under Firebase → Authentication → Authorized domains, ' +
      'complete the reCAPTCHA below, then try again.'
    )
  }
  if (code === 'auth/captcha-check-failed') {
    return 'Complete the “I\'m not a robot” check below, then try again.'
  }
  if (code === 'auth/operation-not-allowed') {
    const msg = err?.message || ''
    if (msg.includes('region') || msg.includes('SMS unable')) {
      return (
        'SMS is not enabled for Pakistan (+92) in your Firebase project. ' +
        'Go to Firebase Console → Authentication → Settings → SMS region policy, ' +
        'choose “Allow” and add Pakistan (or allow all regions). Save, wait 1–2 minutes, then try again.'
      )
    }
    return (
      'Phone sign-in blocked by Firebase. If Phone is already enabled, check SMS region policy ' +
      '(allow Pakistan +92) or upgrade to Blaze for real SMS. For free testing, add a test phone number ' +
      'under Authentication → Sign-in method → Phone → Phone numbers for testing.'
    )
  }
  if (code === 'auth/invalid-phone-number') {
    return 'This phone number is not valid. Use a Pakistani mobile number like 03XX XXXXXXX.'
  }
  if (code === 'auth/too-many-requests' || code === 'auth/quota-exceeded') {
    return 'Too many attempts. Wait a few minutes and try again.'
  }
  if (code === 'auth/missing-phone-number') {
    return 'Enter your mobile number.'
  }
  if (err?.message) {
    return `${err.message}${code ? ` [${code}]` : ''}`
  }
  return 'Could not send OTP. Check your number, complete reCAPTCHA, and try again.'
}

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const recaptchaRef = useRef(null)
  const verifierRef = useRef(null)

  async function clearRecaptcha() {
    if (verifierRef.current) {
      try {
        verifierRef.current.clear()
      } catch {
        /* already cleared */
      }
      verifierRef.current = null
    }
    if (recaptchaRef.current) {
      recaptchaRef.current.innerHTML = ''
    }
    setRecaptchaReady(false)
  }

  async function ensureRecaptcha() {
    if (verifierRef.current) return verifierRef.current
    if (!recaptchaRef.current) {
      throw new Error('reCAPTCHA container missing')
    }

    verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
      size: 'normal',
      callback: () => setRecaptchaReady(true),
      'expired-callback': () => {
        setRecaptchaReady(false)
        setError('Security check expired. Complete it again below.')
        clearRecaptcha()
      },
    })

    await verifierRef.current.render()
    setRecaptchaReady(true)
    return verifierRef.current
  }

  const e164 = toE164Pakistan(phone)

  async function sendOtp(e) {
    e.preventDefault()
    setError('')
    if (!e164) {
      setError('Enter a valid Pakistani mobile number (10 digits after 03).')
      return
    }
    setLoading(true)
    try {
      const verifier = await ensureRecaptcha()
      const result = await signInWithPhoneNumber(auth, e164, verifier)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      console.error('Phone auth error:', err)
      setError(mapAuthError(err))
      await clearRecaptcha()
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) {
      setError('Enter the 6-digit code from SMS.')
      return
    }
    setLoading(true)
    try {
      await confirmation.confirm(otp)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('OTP verify error:', err)
      setError(
        err?.code === 'auth/invalid-verification-code'
          ? 'Incorrect code. Check the SMS and try again.'
          : 'Could not verify code. Try again or request a new OTP.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function backToPhone() {
    setStep('phone')
    setOtp('')
    setConfirmation(null)
    setError('')
    await clearRecaptcha()
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 max-w-[430px] mx-auto">
      <div className="text-center mb-6">
        <span className="text-5xl mb-3 block">📚</span>
        <h1 className="text-2xl font-bold text-primary">Share a Book</h1>
        <p className="text-primary/60 text-sm mt-1">Free school book exchange</p>
      </div>

      {isLocalhost && window.location.hostname === 'localhost' && (
        <div className="w-full mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
          <strong>Local dev tip:</strong> Phone OTP does not work on{' '}
          <code className="bg-amber-100 px-1 rounded">localhost</code>. Use{' '}
          <a href="http://127.0.0.1:5173/login" className="underline font-medium">
            http://127.0.0.1:5173
          </a>{' '}
          and add <strong>127.0.0.1</strong> in Firebase Authorized domains. For testing
          without SMS, add a test phone number in Firebase → Authentication → Phone →
          Phone numbers for testing.
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="w-full space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-primary">Mobile number</span>
            <div className="mt-1 flex rounded-lg border border-primary/20 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-accent">
              <span className="px-3 py-3 bg-primary/5 text-primary font-medium text-sm">+92</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="3XX XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                className="flex-1 px-3 py-3 outline-none text-primary"
                autoComplete="tel"
              />
            </div>
            {e164 && (
              <p className="text-xs text-primary/50 mt-1">{formatPhoneDisplay(e164)}</p>
            )}
          </label>

          <div className="flex justify-center min-h-[78px]">
            <div ref={recaptchaRef} />
          </div>

          {error && <p className="text-red-600 text-sm leading-relaxed">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
          {!recaptchaReady && !loading && (
            <p className="text-xs text-center text-primary/40">
              Complete the security check above before sending OTP.
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="w-full space-y-4">
          <p className="text-sm text-primary/70 text-center">
            Code sent to {formatPhoneDisplay(e164)}
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 rounded-lg border border-primary/20 text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm text-center leading-relaxed">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
          <button
            type="button"
            onClick={backToPhone}
            className="w-full text-sm text-primary/60"
          >
            Change number
          </button>
        </form>
      )}

      <Link to="/about" className="mt-8 text-sm text-accent font-medium">
        Learn more about Share a Book
      </Link>
    </div>
  )
}

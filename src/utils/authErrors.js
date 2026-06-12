const SEND_OTP_MESSAGES = {
  'auth/invalid-app-credential': null,
  'auth/app-not-authorized': null,
  'auth/captcha-check-failed': 'Complete the security check below, then try again.',
  'auth/invalid-phone-number': 'This phone number is not valid. Use a Pakistani mobile number like 03XX XXXXXXX.',
  'auth/missing-phone-number': 'Enter your mobile number.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/quota-exceeded': 'SMS service is busy right now. Please try again in a few minutes.',
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/internal-error': 'Something went wrong on our side. Please try again.',
  'auth/argument-error': 'Could not send the code. Please refresh the page and try again.',
  'auth/missing-app-credential': 'Could not send the code. Please refresh the page and try again.',
  'auth/operation-not-allowed': null,
}

const VERIFY_OTP_MESSAGES = {
  'auth/invalid-verification-code': 'Incorrect code. Check the SMS and try again.',
  'auth/invalid-verification-id': 'This code has expired. Go back and request a new OTP.',
  'auth/code-expired': 'This code has expired. Go back and request a new OTP.',
  'auth/session-expired': 'This session expired. Go back and request a new OTP.',
  'auth/missing-verification-code': 'Enter the 6-digit code from your SMS.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/internal-error': 'Something went wrong. Please try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support if you need help.',
}

function operationNotAllowedMessage(err) {
  const msg = err?.message || ''
  if (msg.includes('region') || msg.includes('SMS unable')) {
    return (
      'SMS is not available for Pakistan (+92) on this app yet. ' +
      'Please contact the app admin.'
    )
  }
  return 'Phone sign-in is not available right now. Please try again later or contact support.'
}

function appCredentialMessage() {
  const host = window.location.hostname
  if (host === 'localhost') {
    return (
      'Phone login does not work on localhost. Use http://127.0.0.1:5173 instead, ' +
      'or test with a phone number added in Firebase test numbers.'
    )
  }
  return 'Security check failed. Complete the check below and try again.'
}

export function mapSendOtpError(err) {
  const code = err?.code || ''

  if (code === 'auth/invalid-app-credential' || code === 'auth/app-not-authorized') {
    return appCredentialMessage()
  }
  if (code === 'auth/operation-not-allowed') {
    return operationNotAllowedMessage(err)
  }

  const mapped = SEND_OTP_MESSAGES[code]
  if (mapped) return mapped

  return 'Could not send the code. Please check your number and try again.'
}

export function mapVerifyOtpError(err) {
  const code = err?.code || ''
  const mapped = VERIFY_OTP_MESSAGES[code]
  if (mapped) return mapped

  return 'Could not verify the code. Please try again or request a new OTP.'
}

import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v.startsWith('your-'))
  .map(([k]) => k)
if (missing.length) {
  console.error('Firebase config missing in .env:', missing.join(', '))
}

const app = initializeApp(firebaseConfig)

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim()
if (appCheckSiteKey) {
  if (import.meta.env.DEV) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
} else if (!import.meta.env.DEV) {
  console.warn('App Check disabled: set VITE_FIREBASE_APP_CHECK_SITE_KEY in .env')
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

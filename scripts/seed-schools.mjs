/**
 * Seed schools into Firestore. Requires a service account key.
 *
 * 1. Firebase Console → Project Settings → Service accounts → Generate new private key
 * 2. Save as serviceAccountKey.json in project root (gitignored)
 * 3. Run: node scripts/seed-schools.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = join(__dirname, '..', 'serviceAccountKey.json')
const schoolsPath = join(__dirname, '..', 'seed', 'schools.json')

if (!existsSync(keyPath)) {
  console.error(`
Missing serviceAccountKey.json

Download from Firebase Console:
  Project Settings → Service accounts → Generate new private key
  Save as: ${keyPath}

Or add schools manually in Firebase Console → Firestore → schools collection.
Each document needs fields: name (string), city (string)
`)
  process.exit(1)
}

const schools = JSON.parse(readFileSync(schoolsPath, 'utf8'))
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const existing = await db.collection('schools').get()
if (!existing.empty) {
  console.log(`Schools collection already has ${existing.size} document(s). Skipping seed.`)
  console.log('Delete existing schools first if you want to re-seed.')
  process.exit(0)
}

const batch = db.batch()
for (const school of schools) {
  const ref = db.collection('schools').doc()
  batch.set(ref, { name: school.name, city: school.city })
}
await batch.commit()
console.log(`Added ${schools.length} schools to Firestore.`)

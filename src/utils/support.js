import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { buildWhatsAppUrl } from './whatsapp'

export const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP?.trim() || ''

export const SUPPORT_TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'missing_school', label: 'Missing school' },
  { value: 'problem', label: 'Problem with the app' },
  { value: 'other', label: 'Other' },
]

export function supportTopicLabel(value) {
  return SUPPORT_TOPICS.find((t) => t.value === value)?.label || value
}

export function supportWhatsAppConfigured() {
  return SUPPORT_WHATSAPP.replace(/\D/g, '').length >= 10
}

export function buildSupportWhatsAppUrl(profile) {
  const lines = ['Hi! I need help with Share a Book.']
  if (profile?.name) lines.push(`Name: ${profile.name}`)
  if (profile?.school) lines.push(`School: ${profile.school}`)
  return buildWhatsAppUrl(SUPPORT_WHATSAPP, lines.join('\n'))
}

export async function submitSupportMessage({ user, profile, topic, message }) {
  if (!SUPPORT_TOPICS.some((t) => t.value === topic)) {
    throw new Error('Please choose a valid topic.')
  }
  const trimmed = message.trim()
  if (!trimmed) throw new Error('Enter a message.')
  if (trimmed.length > 1000) throw new Error('Message is too long (max 1000 characters).')

  await addDoc(collection(db, 'supportMessages'), {
    userId: user.uid,
    userName: profile?.name || 'Unknown',
    userPhone: profile?.phone || user.phoneNumber || '',
    userSchool: profile?.school || '',
    topic,
    message: trimmed,
    status: 'open',
    createdAt: serverTimestamp(),
  })
}

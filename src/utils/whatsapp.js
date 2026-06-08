export function buildWhatsAppUrl(phoneE164, message) {
  const digits = phoneE164.replace(/\D/g, '')
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}

export function contactMessage(posterName, title, grade) {
  return `Hi ${posterName}! I saw your listing on Share a Book — is the ${title} (${grade}) still available?`
}

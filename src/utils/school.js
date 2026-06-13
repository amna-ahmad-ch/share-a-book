/** Normalize a Firestore school document (field names may vary). */
export function parseSchoolDoc(id, data) {
  const name = data.name || data.schoolName || data.school || ''
  const branch = data.branch || data.Branch || ''
  const city = data.city || data.location || ''
  return { id, name, branch, city }
}

/** Label for dropdowns and lists. */
export function formatSchoolLabel(school) {
  const parts = [school.name]
  if (school.branch) parts.push(school.branch)
  let label = parts.filter(Boolean).join(', ')
  if (school.city) label += ` — ${school.city}`
  return label
}

/** Value stored on the user profile. */
export function formatSchoolProfile(school) {
  const parts = [school.name]
  if (school.branch) parts.push(school.branch)
  if (school.city) parts.push(school.city)
  return parts.filter(Boolean).join(', ')
}

/** Match a profile school string back to a schools list entry. */
export function findSchoolIdForProfile(schools, profileSchool) {
  if (!profileSchool) return ''
  const match = schools.find((s) => formatSchoolProfile(s) === profileSchool)
  return match?.id || ''
}

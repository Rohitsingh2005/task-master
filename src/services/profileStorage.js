import { parseJSON, writeJSON } from './storage'

export const PROFILE_KEY = 'userProfile'

export const DEFAULT_PROFILE = {
  name: 'Your Name',
  position: 'Your Position',
  photo: '',
}

const isImageDataUrl = (value) =>
  typeof value === 'string' && value.startsWith('data:image/')

export const parseProfile = (rawProfile) => {
  const savedProfile = parseJSON(rawProfile, null)

  if (!savedProfile || typeof savedProfile !== 'object') {
    return DEFAULT_PROFILE
  }

  return {
    name: savedProfile.name?.trim() || DEFAULT_PROFILE.name,
    position: savedProfile.position?.trim() || DEFAULT_PROFILE.position,
    photo: isImageDataUrl(savedProfile.photo) ? savedProfile.photo : '',
  }
}

export const saveProfile = (profile) => {
  try {
    writeJSON(PROFILE_KEY, {
      name: profile.name.trim(),
      position: profile.position.trim(),
      photo: isImageDataUrl(profile.photo) ? profile.photo : '',
    })
  } catch {
    return false
  }

  return true
}

export const getInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}

export const getFirstName = (name) => {
  return String(name || '').trim().split(/\s+/)[0] || ''
}

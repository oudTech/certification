/** Normalize stored certificate image values into a browser-usable URL. */
export function certificateImageUrl(image) {
  if (!image) return ''
  const value = String(image).trim()
  if (!value) return ''

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value
  }

  if (value.startsWith('/')) return value

  const cleaned = value.replace(/^certificates\//i, '')
  return `/certificates/${cleaned}`
}

function normalizeList(values) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))]
}

function parseMaybeJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Normalize a settings row from file store or Postgres. */
export function unpackSettingsRow(row) {
  if (!row) return null

  const base = {
    ...row,
    cohorts: parseMaybeJsonArray(row.cohorts),
    award_dates: parseMaybeJsonArray(row.award_dates),
  }

  // Legacy: cohorts packed inside invoice_terms JSON (MySQL era)
  if (!base.cohorts.length && typeof row.invoice_terms === 'string') {
    try {
      const parsed = JSON.parse(row.invoice_terms)
      if (parsed && typeof parsed === 'object' && parsed.__oudtech === 1) {
        base.invoice_terms = parsed.invoice_terms || 'terms'
        base.cohorts = Array.isArray(parsed.cohorts) ? parsed.cohorts : []
        base.award_dates = Array.isArray(parsed.award_dates) ? parsed.award_dates : []
      }
    } catch {
      // plain text
    }
  }

  return base
}

export { normalizeList }

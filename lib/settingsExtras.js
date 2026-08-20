function packSettingsExtras(settings) {
  return JSON.stringify({
    __oudtech: 1,
    invoice_terms: settings.invoice_terms || 'terms',
    cohorts: Array.isArray(settings.cohorts) ? settings.cohorts : [],
    award_dates: Array.isArray(settings.award_dates) ? settings.award_dates : [],
  })
}

function unpackSettingsRow(row) {
  if (!row) return null
  const base = { ...row, cohorts: [], award_dates: [] }

  try {
    const parsed = JSON.parse(row.invoice_terms)
    if (parsed && typeof parsed === 'object' && parsed.__oudtech === 1) {
      base.invoice_terms = parsed.invoice_terms || 'terms'
      base.cohorts = Array.isArray(parsed.cohorts) ? parsed.cohorts : []
      base.award_dates = Array.isArray(parsed.award_dates) ? parsed.award_dates : []
      return base
    }
  } catch {
    // plain text invoice_terms
  }

  if (Array.isArray(row.cohorts)) base.cohorts = row.cohorts
  if (Array.isArray(row.award_dates)) base.award_dates = row.award_dates
  return base
}

function normalizeList(values) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))]
}

export { packSettingsExtras, unpackSettingsRow, normalizeList }

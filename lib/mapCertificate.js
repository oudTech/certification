function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

export function rowToCertificate(row) {
  if (!row) return null

  const image = row.image
    ? row.image.startsWith('http') || row.image.startsWith('/')
      ? row.image
      : `/certificates/${row.image}`
    : null

  return {
    id: row.id,
    certificateId: row.tracking_number,
    studentName: row.receiver_name || '',
    studentEmail: row.receiver_email || '',
    studentContact: row.receiver_contact || '',
    className: row.status || '',
    specialNotes: decodeHtml(row.pdesc || ''),
    awardDate: row.dispatch_date || '',
    currentLocation: row.current_location || '',
    image,
    createdAt: row.date || null,
  }
}

export function certificateToRow(payload, { forUpdate = false } = {}) {
  const row = {
    tracking_number: String(payload.certificateId || '').trim(),
    receiver_name: String(payload.studentName || '').trim(),
    receiver_email: String(payload.studentEmail || '').trim(),
    receiver_contact: String(payload.studentContact || '').trim(),
    status: String(payload.className || '').trim(),
    pdesc: String(payload.specialNotes || '').trim(),
    dispatch_date: String(payload.awardDate || '').trim(),
    current_location: String(payload.currentLocation || '').trim(),
    image: normalizeImageValue(payload.image),
    sender_name: '',
    sender_contact: '',
    sender_email: '',
    sender_address: '',
    dispatch_location: '',
    receiver_address: '',
    delivery_date: '',
    destination: '',
    carrier: '',
    carrier_ref: '',
    ship_mode: '',
    weight: '',
    quantity: '',
    payment_mode: '',
    delivery_time: '',
  }

  if (forUpdate) {
    delete row.sender_name
    delete row.sender_contact
    delete row.sender_email
    delete row.sender_address
    delete row.dispatch_location
    delete row.receiver_address
    delete row.delivery_date
    delete row.destination
    delete row.carrier
    delete row.carrier_ref
    delete row.ship_mode
    delete row.weight
    delete row.quantity
    delete row.payment_mode
    delete row.delivery_time
  }

  return row
}

function normalizeImageValue(image) {
  if (!image) return ''
  const value = String(image).trim()
  if (value.startsWith('/certificates/')) {
    return value.replace('/certificates/', '')
  }
  return value
}

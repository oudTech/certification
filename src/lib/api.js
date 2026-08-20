const TOKEN_KEY = 'oudtech_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = false, formData } = {}) {
  const headers = {}
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  if (body && !formData) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.detail || data.error || 'Request failed')
    error.status = res.status
    error.code = data.code
    throw error
  }
  return data
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/api/auth/me', { auth: true }),
  lookup: (certificateId) =>
    request(`/api/certificates/lookup/${encodeURIComponent(certificateId)}`),
  dashboard: () => request('/api/dashboard', { auth: true }),
  listCertificates: (q = '') =>
    request(`/api/certificates?q=${encodeURIComponent(q)}`, { auth: true }),
  getCertificate: (id) => request(`/api/certificates/${id}`, { auth: true }),
  createCertificate: (payload) =>
    request('/api/certificates', { method: 'POST', body: payload, auth: true }),
  updateCertificate: (id, payload) =>
    request(`/api/certificates/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteCertificate: (id) =>
    request(`/api/certificates/${id}`, { method: 'DELETE', auth: true }),
  getSettings: () => request('/api/settings', { auth: true }),
  updateSettings: (payload) =>
    request('/api/settings', { method: 'PUT', body: payload, auth: true }),
  nextCertificateId: () => request('/api/certificates/next-id', { auth: true }),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return request('/api/upload', { method: 'POST', formData, auth: true })
  },
}

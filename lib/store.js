import bcrypt from 'bcryptjs'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '.data')
const STORE_PATH = join(DATA_DIR, 'store.json')

const seedCertificates = [
  {
    id: 12,
    tracking_number: 'N251-08-640935',
    sender_name: '',
    sender_contact: '',
    sender_email: '',
    sender_address: '',
    status: 'Node 25.1',
    dispatch_location: '',
    receiver_email: 'thankgodogbonna@gmail.com',
    receiver_name: 'ThankGod Ogbonna',
    receiver_contact: '07065709106',
    receiver_address: '',
    dispatch_date: '2025-08-03',
    delivery_date: '',
    pdesc: 'Active in class & Punctual',
    destination: '',
    current_location: null,
    carrier: '',
    carrier_ref: '',
    ship_mode: '',
    weight: '',
    quantity: '',
    payment_mode: '',
    image: 'N251-08-640935.jpg',
    delivery_time: '',
    date: '2025-08-22 10:46:28',
  },
  {
    id: 13,
    tracking_number: 'N251-08-076982',
    sender_name: '',
    sender_contact: '',
    sender_email: '',
    sender_address: '',
    status: 'Node 25.1',
    dispatch_location: '',
    receiver_email: 'davejnr.sitecreation@gmail.com',
    receiver_name: 'Dave Junior',
    receiver_contact: '0987666666',
    receiver_address: '',
    dispatch_date: '2025-08-02',
    delivery_date: '',
    pdesc: 'Intermediate Level',
    destination: '',
    current_location: 'jh',
    carrier: '',
    carrier_ref: '',
    ship_mode: '',
    weight: '',
    quantity: '',
    payment_mode: '',
    image: 'N251-08-076982.png',
    delivery_time: '',
    date: '2025-08-22 10:54:07',
  },
]

function defaultStore() {
  return {
    admin: [
      {
        id: 1,
        username: 'admin',
        // bcrypt hash of "123456" — matches the SQL dump default
        password: bcrypt.hashSync('123456', 10),
      },
    ],
    settings: {
      id: 1,
      sitename: 'Oud Technologies',
      site_title: 'Certification',
      site_url: 'https://cert.oudtechnologies.com',
      track_prefix: 'N251',
      track_num: '6',
      invoice_terms: 'terms',
      allow_print: 'Yes',
      show_map: 'Yes',
      email_name: 'OudTech Certification',
      email_address: 'support@oudtechnologies.com',
      mail_track_update: 'No',
      mail_track_save: 'Yes',
      cohorts: ['Node 25.1'],
      award_dates: ['2025-08-02', '2025-08-03'],
    },
    tracking: structuredClone(seedCertificates),
    nextIds: { tracking: 14, admin: 2 },
  }
}

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    writeFileSync(STORE_PATH, JSON.stringify(defaultStore(), null, 2))
  }
}

export function readStore() {
  ensureStore()
  const store = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
  if (!Array.isArray(store.settings?.cohorts)) store.settings.cohorts = ['Node 25.1']
  if (!Array.isArray(store.settings?.award_dates)) {
    store.settings.award_dates = ['2025-08-02', '2025-08-03']
  }
  return store
}

export function writeStore(store) {
  ensureStore()
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

export function useFileStore() {
  return !process.env.DATABASE_URL && !process.env.DB_HOST
}

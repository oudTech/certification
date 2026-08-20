-- OudTech Certificate Registry — Supabase / PostgreSQL schema
-- Paste into: Supabase → SQL Editor → New query → Run
-- Compatible with the Node API in this project (table/column names preserved).

BEGIN;

-- ---------------------------------------------------------------------------
-- admin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin (
  id          BIGSERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- settings (single-row config; cohorts / award_dates as JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id                 BIGINT PRIMARY KEY DEFAULT 1,
  sitename           TEXT NOT NULL DEFAULT 'Oud Technologies',
  site_title         TEXT NOT NULL DEFAULT 'Certification',
  site_url           TEXT NOT NULL DEFAULT '',
  track_prefix       TEXT NOT NULL DEFAULT 'N251',
  track_num          TEXT NOT NULL DEFAULT '6',
  invoice_terms      TEXT NOT NULL DEFAULT 'terms',
  allow_print        TEXT NOT NULL DEFAULT 'Yes' CHECK (allow_print IN ('Yes', 'No')),
  show_map           TEXT NOT NULL DEFAULT 'Yes' CHECK (show_map IN ('Yes', 'No')),
  email_name         TEXT NOT NULL DEFAULT 'OudTech Certification',
  email_address      TEXT NOT NULL DEFAULT '',
  mail_track_update  TEXT NOT NULL DEFAULT 'No' CHECK (mail_track_update IN ('Yes', 'No')),
  mail_track_save    TEXT NOT NULL DEFAULT 'Yes' CHECK (mail_track_save IN ('Yes', 'No')),
  cohorts            JSONB NOT NULL DEFAULT '[]'::jsonb,
  award_dates        JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

-- ---------------------------------------------------------------------------
-- tracking  (= certificates)
-- Field mapping used by the app:
--   tracking_number → certificate ID
--   receiver_name   → student name
--   receiver_email  → student email
--   receiver_contact→ phone
--   status          → class / cohort
--   dispatch_date   → award date
--   pdesc           → notes
--   image           → certificate image filename or URL
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking (
  id                 BIGSERIAL PRIMARY KEY,
  tracking_number    TEXT NOT NULL,
  sender_name        TEXT NOT NULL DEFAULT '',
  sender_contact     TEXT NOT NULL DEFAULT '',
  sender_email       TEXT NOT NULL DEFAULT '',
  sender_address     TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT '',
  dispatch_location  TEXT NOT NULL DEFAULT '',
  receiver_email     TEXT NOT NULL DEFAULT '',
  receiver_name      TEXT NOT NULL DEFAULT '',
  receiver_contact   TEXT NOT NULL DEFAULT '',
  receiver_address   TEXT NOT NULL DEFAULT '',
  dispatch_date      TEXT NOT NULL DEFAULT '',
  delivery_date      TEXT NOT NULL DEFAULT '',
  pdesc              TEXT NOT NULL DEFAULT '',
  destination        TEXT NOT NULL DEFAULT '',
  current_location   TEXT,
  carrier            TEXT NOT NULL DEFAULT '',
  carrier_ref        TEXT NOT NULL DEFAULT '',
  ship_mode          TEXT NOT NULL DEFAULT '',
  weight             TEXT NOT NULL DEFAULT '',
  quantity           TEXT NOT NULL DEFAULT '',
  payment_mode       TEXT NOT NULL DEFAULT '',
  image              TEXT NOT NULL DEFAULT '',
  delivery_time      TEXT NOT NULL DEFAULT '',
  "date"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tracking_number_uidx
  ON tracking (lower(tracking_number));

CREATE INDEX IF NOT EXISTS tracking_status_idx
  ON tracking (status);

CREATE INDEX IF NOT EXISTS tracking_dispatch_date_idx
  ON tracking (dispatch_date);

-- ---------------------------------------------------------------------------
-- track_update (optional history / notes log — kept for dump parity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS track_update (
  id                BIGSERIAL PRIMARY KEY,
  track_num         TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT '',
  "date"            TEXT NOT NULL DEFAULT '',
  "time"            TEXT NOT NULL DEFAULT '',
  note              TEXT NOT NULL DEFAULT '',
  current_location  TEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_charge   TEXT,
  total_charge      TEXT
);

CREATE INDEX IF NOT EXISTS track_update_track_num_idx
  ON track_update (track_num);

-- ---------------------------------------------------------------------------
-- Seed data (from original MariaDB dump + app extras)
-- Admin password is bcrypt("123456") — change after first login.
-- ---------------------------------------------------------------------------
INSERT INTO admin (id, username, password)
VALUES (
  1,
  'admin@cert.oudtech.com',
  '$2b$10$GT3CG5Q6FnYhT2kVrQKfHOtHI3BkzULf4iuSOWLrdqbgfjFHMCnLy'
)
ON CONFLICT (username) DO NOTHING;

-- Reset sequence if id was inserted explicitly
SELECT setval(pg_get_serial_sequence('admin', 'id'), GREATEST((SELECT MAX(id) FROM admin), 1));

INSERT INTO settings (
  id, sitename, site_title, site_url, track_prefix, track_num,
  invoice_terms, allow_print, show_map, email_name, email_address,
  mail_track_update, mail_track_save, cohorts, award_dates
) VALUES (
  1,
  'Oud Technologies',
  'Certification',
  'https://certification.oudtechnologies.com',
  'N251',
  '6',
  'terms',
  'Yes',
  'Yes',
  'OudTech Certification',
  'support@oudtechnologies.com',
  'No',
  'Yes',
  '["Node 25.1"]'::jsonb,
  '["2025-08-02","2025-08-03"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracking (
  id, tracking_number, status, receiver_email, receiver_name, receiver_contact,
  dispatch_date, pdesc, current_location, image, "date"
) VALUES
  (
    12,
    'N251-08-640935',
    'Node 25.1',
    'thankgodogbonna@gmail.com',
    'ThankGod Ogbonna',
    '07065709106',
    '2025-08-03',
    'Active in class & Punctual',
    NULL,
    'N251-08-640935.jpg',
    '2025-08-22 10:46:28+00'
  ),
  (
    13,
    'N251-08-076982',
    'Node 25.1',
    'davejnr.sitecreation@gmail.com',
    'Dave Junior',
    '0987666666',
    '2025-08-02',
    'Intermediate Level',
    'jh',
    'N251-08-076982.png',
    '2025-08-22 10:54:07+00'
  )
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('tracking', 'id'), GREATEST((SELECT MAX(id) FROM tracking), 1));

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Frontend never uses the anon key; only the server (DATABASE_URL) queries.
-- Enabling RLS with no anon/authenticated policies blocks direct client access.
-- The Postgres connection-string role used by the API still has full access.
-- ---------------------------------------------------------------------------
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_update ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated → PostgREST/anon cannot read or write.
-- (Intentional. Do not add public SELECT policies unless you redesign access.)

COMMIT;

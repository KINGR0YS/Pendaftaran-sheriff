# Sheriff Kerajaan Roxwood — FiveM Recruitment & Roster

Sistem pendaftaran dan manajemen roster Sheriff Kerajaan Roxwood, dibangun dengan Next.js 15 + Supabase.

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Supabase** (Database + Auth)
- **lucide-react** (Icons)

## Getting Started

### 1. Clone

```bash
git clone https://github.com/KINGR0YS/Pendaftaran-sheriff.git
cd Pendaftaran-sheriff
npm install
```

### 2. Environment Variables

Copy `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Setup

Jalankan query berikut di **SQL Editor** Supabase:

```sql
-- 1. Tabel Roster
CREATE TABLE IF NOT EXISTS roster (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ic_name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL,
  division TEXT DEFAULT 'Patrol',
  status TEXT DEFAULT 'Active',
  batch TEXT DEFAULT '1',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pendaftaran
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ooc_name TEXT NOT NULL,
  passport_name_ooc TEXT NOT NULL,
  ooc_age INTEGER NOT NULL,
  ooc_gender TEXT,
  discord_id TEXT NOT NULL,
  steam_hex TEXT NOT NULL,
  playtime TEXT NOT NULL,
  rp_experience_ooc TEXT NOT NULL,
  obligations_other_cities TEXT NOT NULL,
  ic_name TEXT NOT NULL,
  ic_age INTEGER NOT NULL,
  ic_gender TEXT,
  ic_dob TEXT,
  phone_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  experience TEXT NOT NULL,
  criminal_record TEXT NOT NULL,
  work_experience_ic TEXT NOT NULL,
  motivation_roxwood TEXT NOT NULL,
  why_accept_roxwood TEXT NOT NULL,
  active_hours TEXT NOT NULL,
  chain_of_command TEXT NOT NULL,
  scenario_use_of_force TEXT NOT NULL,
  batch TEXT DEFAULT '1',
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Disable RLS
ALTER TABLE roster DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
```

### 4. Buat Admin User

Buat akun admin di **Authentication → Users** di dashboard Supabase, lalu login di `/login`.

### 5. Run

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (hero, divisi, alur, persyaratan) |
| `/apply` | Formulir pendaftaran 3 langkah (OOC → IC → Kualifikasi) |
| `/login` | Login admin (Supabase Auth) |
| `/admin` | Dashboard (ringkasan, pendaftaran, roster, pengaturan) |

## Deployment (Vercel)

```bash
vercel
```

Set environment variables di dashboard Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Original Files

File original (HTML/JS/CSS standalone) tetap tersimpan untuk referensi:
- `index.html`, `app.js`, `style.css`, `schema.sql`

## Credits

- Direct by Cimolbojot
- &copy; 2026 Sheriff Kerajaan Roxwood

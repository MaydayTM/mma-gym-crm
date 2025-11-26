# RCN CRM - Quick Start Guide

## 🚀 Start in 5 Minuten

### Stap 1: Project Aanmaken

```bash
# In je gewenste directory
npm create vite@latest rcn-crm -- --template react-ts
cd rcn-crm

# Kopieer CLAUDE.md en DESIGN_TOKENS.md naar project root
# Kopieer supabase/ folder naar project root
```

### Stap 2: Dependencies Installeren

```bash
# Core dependencies
npm install @supabase/supabase-js @tanstack/react-query react-router-dom

# UI utilities
npm install clsx tailwind-merge lucide-react

# Development
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
```

### Stap 3: Tailwind Setup

```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Stap 4: Supabase Koppelen

```bash
# Login (opent browser)
npx supabase login

# Link naar je project
npx supabase link --project-ref wiuzjpoizxeycrshsuqn

# Push database schema
npx supabase db push

# Genereer TypeScript types
npx supabase gen types typescript --linked > src/types/database.types.ts
```

### Stap 5: Environment Variables

Maak `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Stap 6: Supabase Client

Maak `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Stap 7: Start Development

```bash
npm run dev
```

---

## 📁 Aanbevolen Mappenstructuur

```
rcn-crm/
├── CLAUDE.md              ← Project context (ALTIJD LEZEN)
├── DESIGN_TOKENS.md       ← Fase 2: Design specs
├── .env.local             ← API keys (NIET COMMITTEN)
├── src/
│   ├── components/
│   │   ├── ui/            ← Button, Input, Card, etc.
│   │   ├── dashboard/     ← KPI cards, charts
│   │   ├── members/       ← MembersTable, MemberCard
│   │   ├── leads/         ← LeadsPipeline, LeadCard
│   │   └── layout/        ← Sidebar, Header, Layout
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Members.tsx
│   │   ├── MemberDetail.tsx
│   │   ├── Leads.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useMembers.ts
│   │   ├── useLeads.ts
│   │   ├── useAuth.ts
│   │   └── useDashboardStats.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/
│       └── database.types.ts  ← AUTO-GENERATED
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/          ← Edge Functions
└── tailwind.config.js
```

---

## 🎯 Eerste Prompt voor Claude Code

Na setup, gebruik deze prompt in Claude Code:

```
Lees CLAUDE.md voor project context.

Bouw de volgende componenten in volgorde:

1. src/lib/supabase.ts - Supabase client setup
2. src/hooks/useAuth.ts - Login/logout hook
3. src/hooks/useMembers.ts - CRUD voor members
4. src/components/layout/Layout.tsx - Basis layout met sidebar
5. src/pages/Dashboard.tsx - KPI cards (hardcoded eerst, dan live data)
6. src/pages/Members.tsx - Tabel met leden

Focus op FUNCTIONALITEIT, niet styling.
Gebruik standaard Tailwind classes.
```

---

## ⚡ Handige Commands

```bash
# Development
npm run dev                              # Start dev server

# Supabase
npx supabase gen types typescript --linked > src/types/database.types.ts
npx supabase db push                     # Push migrations
npx supabase functions serve             # Local Edge Functions
npx supabase functions deploy FUNC_NAME  # Deploy function

# Build & Deploy
npm run build                            # Production build
vercel --prod                            # Deploy to Vercel
```

---

## 🔒 Belangrijke Security Notes

1. **NOOIT** `.env.local` committen naar Git
2. **NOOIT** `SUPABASE_SERVICE_ROLE_KEY` in frontend gebruiken
3. **ALTIJD** RLS policies testen voor deployment
4. **ALTIJD** input valideren (Zod recommended)

---

## 📞 Volgende Stappen

Na basis setup:
1. [ ] CSV import bouwen voor 200 bestaande leden
2. [ ] Stripe webhook Edge Function
3. [ ] Design fase starten (screenshots toevoegen)
4. [ ] Toegangscontrole systeem (ESP32 integratie)

---

*Succes met bouwen! 🚀*

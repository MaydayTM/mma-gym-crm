# FightFlow Mobile App

> React Native app built with Expo for the FightFlow martial arts platform.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and add your Supabase keys
cp .env.example .env
# Edit .env with your EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Start development server
npm start
```

## Development

```bash
# Start Expo dev server
npm start

# Run on iOS simulator (requires Xcode)
npm run ios

# Run on Android emulator (requires Android Studio)
npm run android

# Run in web browser
npm run web
```

## Testing on Device

1. Install **Expo Go** app on your phone
2. Run `npm start`
3. Scan QR code with your phone

## Project Structure

```
apps/mobile/
├── app/                  # App screens (Expo Router)
│   ├── (tabs)/          # Tab navigation
│   │   ├── index.tsx    # QR Code (home)
│   │   ├── schedule.tsx # Class schedule
│   │   ├── feed.tsx     # FightFlow feed
│   │   ├── search.tsx   # Search
│   │   └── profile.tsx  # User profile
│   ├── auth/            # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
├── hooks/               # Custom hooks
├── lib/                 # Utilities
│   └── supabase.ts     # Supabase client
└── assets/             # Images, fonts
```

## Features

### MVP (P0)
- [x] QR Code screen for gym access
- [x] Class schedule with reservations
- [x] User profile with belt display
- [x] Settings (account, password, logout)
- [x] Login/Register flow

### Coming Soon (P1)
- [ ] FightFlow Feed (YouTube Shorts)
- [ ] Profile photo upload
- [ ] Push notifications

## Building

```bash
# Development build (with dev menu)
npm run build:dev

# Preview build (for TestFlight/internal testing)
npm run build:preview

# Production build
npm run build:prod
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Tech Stack

- **Framework:** Expo + React Native
- **Navigation:** Expo Router (file-based)
- **Backend:** Supabase (shared with web CRM)
- **Styling:** React Native StyleSheet
- **Icons:** @expo/vector-icons (Ionicons)

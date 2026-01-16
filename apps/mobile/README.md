# COMBO Mobile App

> React Native app built with Expo for the COMBO martial arts platform.

## Prerequisites

The following tools should already be installed globally (from your other project):

| Tool | Command to verify | Purpose |
|------|-------------------|---------|
| EAS CLI | `eas --version` | Build & submit to stores |
| CocoaPods | `pod --version` | iOS native dependencies |
| Ruby | `ruby --version` | Required for CocoaPods |

## Quick Start

When ready to start building the mobile app:

```bash
# 1. Initialize Expo project in this directory
npx create-expo-app@latest . --template blank-typescript

# 2. Add dev client for local builds
npx expo install expo-dev-client

# 3. Install Supabase and other dependencies
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# 4. Generate native projects (iOS/Android folders)
npx expo prebuild

# 5. Link to EAS (uses eas.json in root)
eas build:configure
```

## Development

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator (requires Xcode)
npx expo run:ios

# Run on Android emulator (requires Android Studio)
npx expo run:android
```

## Building

```bash
# Development build (with dev menu)
eas build --profile development --platform ios

# Preview build (for TestFlight/internal testing)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
```

## Project Structure (Planned)

```
apps/mobile/
├── app/                  # App screens (Expo Router)
│   ├── (tabs)/          # Tab navigation
│   │   ├── index.tsx    # Home/Dashboard
│   │   ├── schedule.tsx # Class schedule
│   │   ├── profile.tsx  # User profile
│   │   └── social.tsx   # FightFlow feed
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

## Shared Code

The `@combo/shared` package (in `/packages/shared`) contains:
- TypeScript types
- Utility functions
- Constants (belt colors, disciplines, etc.)

Import like:
```typescript
import { BELT_COLORS, formatBeltDisplay } from '@combo/shared';
```

## Environment Variables

Create `.env` in this directory:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Note: Expo uses `EXPO_PUBLIC_` prefix for client-side env vars.

## Notes

- iOS builds require Xcode (7GB download)
- Android builds require Android Studio (2GB download)
- EAS cloud builds work without local Xcode/Android Studio

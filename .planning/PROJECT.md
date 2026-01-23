# RCN CRM - Project Overview

## Vision
Een eigen CRM voor Reconnect Academy (MMA/BJJ gym in Aalst) om ClubPlanner te vervangen met een modern, flexibel systeem.

## Current State
- **MVP Features:** Complete (members, leads, schedule, check-ins, belts, reports)
- **Auth:** Supabase Auth with email/password
- **Email:** Resend SMTP via reconnect.academy domain
- **Status:** Production-ready, needs member onboarding flow

## Tech Stack
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth)
- **State:** TanStack Query
- **Hosting:** Vercel
- **Email:** Resend (noreply@reconnect.academy)

## Key Challenges
1. **Member Onboarding:** 200 existing members imported from ClubPlanner need to claim their accounts
2. **No passwords:** Old system passwords cannot be migrated
3. **Data integrity:** Members have historical data (check-ins, belts) that must be preserved

## Success Criteria
- Existing members can activate their accounts via email
- Account activation links member record to Supabase Auth
- All historical data remains accessible after activation

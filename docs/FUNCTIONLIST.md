# RCN CRM - Complete Function List

> **Laatst bijgewerkt:** 24 januari 2026
> **Versie:** 0.1.0 MVP

---

## Quick Overview

| Categorie | Aantal |
|-----------|--------|
| Pages | 33 |
| Hooks | 149+ |
| Database Tabellen | 30 |
| Edge Functions | 15 |
| UI Components | 58 |

---

## 1. Core CRM

### 1.1 Ledenbeheer (Members)

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Leden overzicht | Tabel met zoeken, filteren, sorteren | Done |
| Lid aanmaken | Formulier met validatie | Done |
| Lid bewerken | Alle velden aanpasbaar | Done |
| Lid verwijderen | Soft delete optie | Done |
| Profielfoto | Upload naar Supabase Storage | Done |
| Adres + Geocoding | Adres met lat/lng voor kaart | Done |
| CSV Import | Bulk import met field mapping | Done |
| Duplicaat detectie | Scan op naam/email/telefoon | Done |
| Status beheer | Active, Frozen, Cancelled, Lead | Done |

### 1.2 Gordel Tracking (Belt System)

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Multi-discipline | BJJ, Judo, Karate, etc. | Done |
| Gordel per discipline | Aparte tracking per sport | Done |
| Stripes | 0-4 stripes per gordel | Done |
| Promotie historie | Datum + training count | Done |
| Promotie modal | UI voor gordel upgrade | Done |

### 1.3 Lead Management

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Kanban pipeline | Drag & drop status wijzigen | Done |
| Lead statussen | New, Contacted, Trial Scheduled, Trial Done, Converted, Lost | Done |
| Lead bronnen | Facebook, Instagram, Website, Walk-in, Referral | Done |
| Lead → Member | Conversie met data overname | Done |
| Proefles planning | Trial date tracking | Done |
| Interesse tracking | Welke disciplines | Done |

### 1.4 Abonnementen (Subscriptions)

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Abonnement toewijzen | Plan koppelen aan lid | Done |
| Status tracking | Active, Cancelled, Expired, Frozen, Pending | Done |
| MRR berekening | Monthly Recurring Revenue | Done |
| Leeftijdsgroepen | Kids, Students, Adults | Done |
| Plan types | Basis, All-In, custom | Done |
| Prijsmatrix | Dynamische prijzen per combo | Done |
| Kortingscodes | Promo codes met validatie | Done |
| Add-ons | Extra producten bij abo | Done |
| Dagpassen | One-time products | Done |

---

## 2. Planning & Operations

### 2.1 Lesrooster (Schedule)

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Week/maand view | Kalender weergave | Done |
| Les aanmaken | Naam, tijd, discipline, capaciteit | Done |
| Les bewerken | Alle velden aanpasbaar | Done |
| Les verwijderen | Single of bulk delete | Done |
| Recurring classes | Wekelijks herhalen tot einddatum | Done |
| Class tracks | Beginner, Advanced, Competition | Done |
| Ruimte toewijzing | Meerdere zalen ondersteuning | Done |
| Coach toewijzing | Coach koppelen aan les | Done |

### 2.2 Reservaties

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Week overzicht | Alle lessen met beschikbaarheid | Done |
| Inschrijven | Lid inschrijven voor les | Done |
| Uitschrijven | Reservering annuleren | Done |
| Capaciteit check | Max deelnemers controle | Done |
| Check-in status | Per reservering bijhouden | Done |

### 2.3 Check-in Systeem

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Handmatig check-in | Via CRM interface | Done |
| QR Code | Placeholder voor scanner | Done |
| Check-in historie | Per lid bekijken | Done |
| Laatste check-in | Op member detail pagina | Done |

### 2.4 Fysieke Toegang (Door Access)

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Deur configuratie | Meerdere deuren ondersteuning | Done |
| QR Token generatie | Unieke toegangscode | Done |
| Toegang validatie | Check actief abo + status | Done |
| Access logging | Alle pogingen loggen | Done |
| Test pagina | DoorTest voor debugging | Done |

---

## 3. Analytics & Rapportages

### 3.1 Dashboard

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Actieve leden | Real-time count | Done |
| Nieuwe leden | Deze maand | Done |
| Opzeggingen | Deze maand | Done |
| MRR | Monthly Recurring Revenue | Done |
| Quick actions | Snelkoppelingen | Done |

### 3.2 Reports

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Periode selectie | 7d, 30d, 90d, 365d | Done |
| Leden groei | New vs cancelled grafiek | Done |
| Check-in frequentie | Gemiddelde per lid | Done |
| Top disciplines | Populairste sporten | Done |
| Retentie score | Churn berekening | Done |

---

## 4. Modules (Premium)

### 4.1 Shop Module

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Product catalog | Producten met categorieën | Done |
| Product varianten | Maat, kleur, etc. | Done |
| Voorraad beheer | Stock tracking | Done |
| Low-stock alerts | Waarschuwing bij lage voorraad | Done |
| Winkelwagen | Shopping cart | Done |
| Checkout | Mollie betaling | Done |
| Ordergeschiedenis | Alle bestellingen | Done |
| Banners | Promotionele afbeeldingen | Done |
| Kortingscodes | Discount codes | Done |

### 4.2 Email Marketing Module

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Email templates | Herbruikbare templates | Done |
| Template editor | HTML met variabelen | Done |
| Campagnes | Bulk mailing | Done |
| Audience targeting | Filter op status, rol, discipline | Done |
| Custom recipients | Handmatige selectie | Done |
| Campagne stats | Opens, clicks, bounces | Done |
| Unsubscribe handling | Wettelijk verplicht | Done |

### 4.3 GymScreen Module

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Slides beheer | Afbeeldingen + tekst | Done |
| Verjaardagen | Automatisch tonen | Done |
| Instellingen | Display configuratie | Done |
| Live preview | Real-time weergave | Done |
| Fullscreen modus | Voor TV scherm | Done |

---

## 5. AI Features (Kitana)

### 5.1 Kitana AI Hub

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Chat interface | Tekst input | Done |
| Voice input | Web Speech API | Done |
| Text-to-speech | Gesproken antwoorden | Done |
| Floating button | Altijd beschikbaar | Done |
| Suggested questions | Quick actions | Done |

### 5.2 AI Agent Functions

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Email Agent | Email schrijven en versturen | Done |
| Reports Agent | Rapportages genereren | Done |
| Member Search | Leden/contacten zoeken | Done |
| Phone Lookup | Telefoonnummers opzoeken | Done |
| Data Analysis | Statistieken analyseren | Done |
| Custom Tasks | Vrije opdrachten | Done |

---

## 6. User Management

### 6.1 Authenticatie

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Email/wachtwoord login | Supabase Auth | Done |
| Google OAuth | Social login | Done |
| Wachtwoord vergeten | Reset flow | Done |
| Wachtwoord reset | Met token verificatie | Done |
| Account claimen | Via member nummer of email | Done |
| Account activeren | Wachtwoord instellen | Done |

### 6.2 Rollen & Permissies

| Rol | Beschrijving | Toegang |
|-----|--------------|---------|
| Admin | Volledige toegang | Alles |
| Medewerker | Dagelijkse operaties | Leden, Check-ins, geen financiën |
| Coordinator | Rooster beheer | Planning, Groepen, Communicatie |
| Coach | Les specifiek | Eigen lessen, Aanwezigheid |
| Fighter | Basis lid | Eigen profiel, Reserveringen, Check-in |
| Fan | Beperkt | Alleen bekijken |

### 6.3 Team Beheer

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Team overzicht | Alle medewerkers per rol | Done |
| Coach toewijzing | Aan lessen koppelen | Done |
| Rol wijzigen | Admin functie | Done |

### 6.4 Instellingen

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| Onboarding | Uitnodiging settings | Done |
| Betalingen | Provider configuratie | Done |
| Rooster | Schedule defaults | Done |
| Gym Profiel | Naam, adres, contact | Done |
| Users & Rollen | Permissie beheer | Done |
| Notificaties | Email settings | Done |
| Branding | Logo, kleuren | Done |
| Security | Wachtwoord policies | Done |

---

## 7. Public Pages

### 7.1 Checkout Flow

| Page | Beschrijving | URL |
|------|--------------|-----|
| Plans Overview | Alle abonnementen | `/checkout/plans` |
| Plan Checkout | Specifiek plan afrekenen | `/checkout/plans/:ageGroup` |
| Checkout Success | Bevestiging | `/checkout/success` |
| Checkout Cancel | Annulering | `/checkout/cancel` |

### 7.2 Shop (Public)

| Page | Beschrijving | URL |
|------|--------------|-----|
| Shop Landing | Product catalog | `/shop` |
| Product Detail | Product pagina | `/shop/product/:id` |
| Cart | Winkelwagen | `/shop/cart` |
| Checkout | Afrekenen | `/shop/checkout` |
| Order Complete | Bevestiging | `/shop/order-complete` |

---

## 8. Backend Services (Edge Functions)

### 8.1 Account Management

| Function | Beschrijving |
|----------|--------------|
| `request-claim-email` | Verstuur activatie email |
| `verify-claim-token` | Controleer token geldigheid |
| `complete-claim` | Voltooi account activatie |
| `admin-set-password` | Admin wachtwoord reset |

### 8.2 Betalingen

| Function | Beschrijving |
|----------|--------------|
| `create-mollie-payment` | Start Mollie betaling (abonnement) |
| `mollie-webhook` | Verwerk Mollie notificaties |
| `create-shop-payment` | Start Mollie betaling (shop) |
| `shop-payment-webhook` | Verwerk shop betaling |

### 8.3 Email

| Function | Beschrijving |
|----------|--------------|
| `send-campaign` | Verstuur email campagne |
| `email-webhook` | Verwerk email events (opens, clicks) |

### 8.4 Toegang

| Function | Beschrijving |
|----------|--------------|
| `door-token` | Genereer QR access token |
| `door-validate` | Valideer toegang |

### 8.5 AI

| Function | Beschrijving |
|----------|--------------|
| `ai-assistant` | Claude AI integratie |
| `generate-description` | AI product beschrijving |

---

## 9. Database Schema

### 9.1 Core Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `members` | Leden met alle profieldata |
| `member_belts` | Gordel per discipline |
| `belt_history` | Promotie historie |
| `subscriptions` | Abonnementen |
| `leads` | Lead pipeline |
| `revenue` | Omzet transacties |

### 9.2 Planning Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `disciplines` | Beschikbare sporten |
| `classes` | Les definities |
| `class_instances` | Recurring instanties |
| `class_tracks` | Training niveaus |
| `rooms` | Zalen |
| `reservations` | Inschrijvingen |
| `checkins` | Bezoek historie |

### 9.3 Access Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `doors` | Deur configuratie |
| `door_access_logs` | Toegangs logging |

### 9.4 Shop Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `products` | Product catalog |
| `product_variants` | Varianten |
| `shop_orders` | Bestellingen |
| `shop_order_items` | Order regels |
| `shop_banners` | Promo banners |
| `shop_discount_codes` | Kortingscodes |

### 9.5 Email Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `email_templates` | Templates |
| `email_campaigns` | Campagnes |
| `email_sends` | Individuele verzendingen |
| `email_events` | Event tracking |
| `email_unsubscribes` | Uitschrijvingen |

### 9.6 Module Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `modules` | Beschikbare modules |
| `tenant_module_subscriptions` | Actieve modules per tenant |
| `gymscreen_slides` | GymScreen content |
| `gymscreen_settings` | Display settings |

### 9.7 Config Tabellen

| Tabel | Beschrijving |
|-------|--------------|
| `integrations` | Payment providers |
| `import_field_mapping` | CSV import config |
| `tasks` | Automation queue |
| `webhook_events` | Webhook logging |
| `activity_log` | Algemene logging |

---

## 10. Technische Architectuur

### 10.1 Stack

| Component | Technologie |
|-----------|-------------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS |
| State Management | TanStack Query (React Query) |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth) |
| Payments | Mollie |
| Hosting | Vercel |
| AI | Anthropic Claude API |

### 10.2 Security

| Feature | Implementatie |
|---------|--------------|
| Authentication | Supabase Auth (email + OAuth) |
| Authorization | Row Level Security (RLS) |
| API Protection | Supabase service roles |
| CORS | Configured per function |
| Token Verification | JWT validation |

---

## 11. Module Systeem

### 11.1 Core Modules (Gratis)

- Dashboard
- Leden
- Leads
- Abonnementen
- Rooster
- Reservaties
- Check-in
- Rapportages
- Taken
- Team
- Instellingen

### 11.2 Premium Modules

| Module | Prijs/maand | Beschrijving |
|--------|-------------|--------------|
| Shop | €29 | Webshop met producten en bestellingen |
| Email Marketing | €19 | Campagnes en templates |
| Contracten | €15 | Digitale handtekeningen |
| Evenementen | €25 | Seminars, camps, wedstrijden |

### 11.3 Module Access Logic

- **Owner tenant (Reconnect):** Altijd volledige toegang
- **Andere tenants:** Trial (30 dagen) → Active (betaald) → Expired
- **Expired trials:** Zichtbaar in sidebar met "Verlopen" badge, geen toegang

---

## 12. Externe Integraties

### 12.1 Actief

| Service | Gebruik |
|---------|---------|
| Supabase | Database, Auth, Storage, Edge Functions |
| Mollie | Betalingen (iDEAL, Bancontact, etc.) |
| Vercel | Hosting + CI/CD |
| Anthropic Claude | AI Assistant |
| Resend | Email verzending |

### 12.2 Gepland

| Service | Gebruik |
|---------|---------|
| Stripe | Alternatieve payment provider |
| ESP32 | Fysieke deur controller |
| Twilio | SMS notificaties |

---

## 13. Disciplines

| Discipline | Code | Gordel Systeem |
|------------|------|----------------|
| Brazilian Jiu-Jitsu | `bjj` | White → Blue → Purple → Brown → Black |
| Mixed Martial Arts | `mma` | Geen gordels |
| Kickboxing | `kickboxing` | Geen gordels |
| Judo | `judo` | Kyu/Dan systeem |
| Karate | `karate` | Kyu/Dan systeem |
| Muay Thai | `muay_thai` | Prajiad/Mongkol |
| Boksen | `boksen` | Geen gordels |
| Worstelen | `wrestling` | Geen gordels |
| Grappling | `grappling` | Optioneel |
| Kids MMA | `kids_mma` | Aangepast |

---

## 14. Versie Historie

| Versie | Datum | Wijzigingen |
|--------|-------|-------------|
| 0.1.0 | Jan 2026 | MVP Launch - Alle core features |

---

*Document gegenereerd op 24 januari 2026*

# RCN CRM - Design Tokens & Styling Guide

## 🎨 STATUS: FASE 2 (NOG NIET ACTIEF)

> **Let op:** Dit bestand wordt ingevuld NADAT de functionele MVP werkt.
> In Fase 1 gebruiken we standaard Tailwind classes zonder specifieke design keuzes.

---

## 📸 DESIGN REFERENTIES

### Screenshots toe te voegen:
Voeg hier screenshots toe van UI's die je mooi vindt:

```
/design-references/
├── dashboard-example-1.png    # Beschrijving: ...
├── members-table-example.png  # Beschrijving: ...
├── sidebar-example.png        # Beschrijving: ...
└── cards-example.png          # Beschrijving: ...
```

### Instructie voor Claude Code:
Wanneer je een screenshot toevoegt, gebruik deze prompt:

```
Bekijk de screenshot in /design-references/[naam].png
Pas [ComponentNaam] aan om deze stijl te volgen.
Behoud ALLE bestaande functionaliteit.
Wijzig alleen de Tailwind classes voor styling.
```

---

## 🎨 KLEURENPALET (in te vullen)

### Primary Colors
```javascript
// tailwind.config.js - extend colors
colors: {
  primary: {
    50:  '#...', // Lightest
    100: '#...',
    200: '#...',
    300: '#...',
    400: '#...',
    500: '#...', // Default
    600: '#...',
    700: '#...',
    800: '#...',
    900: '#...', // Darkest
  },
  // ...
}
```

### Semantic Colors
| Naam | Gebruik | Hex |
|------|---------|-----|
| `success` | Bevestigingen, actief | `#...` |
| `warning` | Waarschuwingen | `#...` |
| `danger` | Fouten, verwijderen | `#...` |
| `info` | Informatief | `#...` |

### Belt Colors (BJJ/Martial Arts)
| Belt | Hex | Tailwind Class |
|------|-----|----------------|
| White | `#FFFFFF` | `bg-white` |
| Grey | `#808080` | `bg-gray-500` |
| Blue | `#0066CC` | `bg-blue-600` |
| Purple | `#663399` | `bg-purple-600` |
| Brown | `#8B4513` | `bg-amber-800` |
| Black | `#1a1a1a` | `bg-gray-900` |

---

## 📐 TYPOGRAPHY (in te vullen)

### Font Families
```javascript
// tailwind.config.js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  heading: ['...', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Font Sizes
| Naam | Size | Line Height | Gebruik |
|------|------|-------------|---------|
| `xs` | 12px | 16px | Labels, badges |
| `sm` | 14px | 20px | Body small |
| `base` | 16px | 24px | Body |
| `lg` | 18px | 28px | Subheadings |
| `xl` | 20px | 28px | Card titles |
| `2xl` | 24px | 32px | Section titles |
| `3xl` | 30px | 36px | Page titles |

---

## 📦 COMPONENT STYLING PATTERNS

### Buttons (voorbeeld)
```tsx
// Fase 1: Functioneel
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">

// Fase 2: Met design tokens
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all">
```

### Cards (voorbeeld)
```tsx
// Fase 1: Functioneel
<div className="bg-white rounded-lg shadow p-4">

// Fase 2: Met design tokens  
<div className="bg-white rounded-xl shadow-card p-6 border border-gray-100 hover:shadow-lg transition-shadow">
```

### Tables (voorbeeld)
```tsx
// Fase 1: Functioneel
<table className="w-full">
  <thead className="border-b">
    <th className="text-left p-2">

// Fase 2: Met design tokens
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
```

---

## 🌗 DARK MODE (optioneel - later)

```javascript
// tailwind.config.js
darkMode: 'class', // of 'media'

// Voorbeeld gebruik
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">
```

---

## 📱 RESPONSIVE BREAKPOINTS

| Breakpoint | Min Width | Gebruik |
|------------|-----------|---------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Mobile-First Approach
```tsx
// Start mobile, scale up
<div className="p-4 md:p-6 lg:p-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## ✅ CHECKLIST VOOR FASE 2

- [ ] Screenshots verzameld van gewenste UI's
- [ ] Kleurenpalet definitief gekozen
- [ ] Font families gekozen en geïnstalleerd
- [ ] tailwind.config.js uitgebreid met design tokens
- [ ] Basis componenten gestyled (Button, Card, Input)
- [ ] Dashboard cards gestyled
- [ ] Members tabel gestyled
- [ ] Sidebar/navigatie gestyled
- [ ] Dark mode (optioneel)

---

## 🔗 INSPIRATIE LINKS

Voeg hier links toe naar designs die je mooi vindt:

- [ ] Dashboard: ...
- [ ] CRM interface: ...
- [ ] Tabel design: ...
- [ ] Kleurenschema: ...

---

*Dit bestand wordt bijgewerkt wanneer we naar Fase 2 (Design) gaan.*

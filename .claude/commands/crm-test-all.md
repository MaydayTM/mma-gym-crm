# RCN CRM Complete Test Suite

Voer alle tests uit en fix eventuele problemen.

## Test Scope
$ARGUMENTS

## Fase 1: Build Verificatie
```bash
npm run build
```
- [ ] TypeScript compileert zonder errors
- [ ] Vite build succesvol
- [ ] Geen warnings die errors kunnen worden

## Fase 2: Lint Check
```bash
npm run lint
```
- [ ] Geen ESLint errors
- [ ] Fix deprecated patterns

## Fase 3: Type Check
```bash
npx tsc --noEmit
```
- [ ] Alle types correct
- [ ] Geen `any` types waar vermijdbaar

## Fase 4: Unit Tests (indien aanwezig)
```bash
npm test
```
- [ ] Alle unit tests slagen

## Fase 5: E2E Tests met Playwright
```bash
npx playwright test
```
Test de volgende flows:
- [ ] Login flow
- [ ] Dashboard laden
- [ ] Leden lijst bekijken
- [ ] Lid detail pagina
- [ ] Lead pipeline
- [ ] Kitana AI chat
- [ ] Settings pagina

## Fase 6: Manual Smoke Tests
Controleer in de browser:
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Alle navigatie werkt
- [ ] Forms submitten correct
- [ ] Error states worden getoond
- [ ] Loading states werken

## Fase 7: Performance
- [ ] Lighthouse score > 80 performance
- [ ] Geen memory leaks
- [ ] Bundle size acceptabel

## Output
Maak een `TEST_REPORT.md` met:
- Test resultaten per fase
- Gefixte issues
- Openstaande items
- Aanbevelingen

Start nu. Fix alle failures voordat je stopt.

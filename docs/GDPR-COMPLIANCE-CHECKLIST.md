# GDPR Compliance Checklist - RCN CRM

> **Doel:** Volledige checklist om te voldoen aan de AVG/GDPR wetgeving voor productie.
> **Laatste update:** 14 januari 2026
> **Status:** In ontwikkeling

---

## Inhoudsopgave

1. [Technische Checklist (Security & Privacy by Design)](#1-technische-checklist)
2. [Functionele Checklist (GDPR-compliance in de software)](#2-functionele-checklist)
3. [Documentatie & Juridisch](#3-documentatie--juridisch)
4. [Implementatie Status RCN CRM](#4-implementatie-status-rcn-crm)

---

## 1. Technische Checklist

### 1.1 Data-encryptie

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Encryptie in rust** | Alle databasevelden met persoonsgegevens versleuteld (AES-256) | ⬜ |
| **Encryptie in transport** | Uitsluitend beveiligde verbindingen (TLS 1.3 of hoger) | ✅ |
| **Database-niveau encryptie** | Supabase Vault voor gevoelige velden (API keys, tokens) | ⬜ |

**Supabase-specifiek:**
- Supabase biedt standaard TLS voor alle verbindingen ✅
- PostgreSQL ondersteunt `pgcrypto` extensie voor veldniveau encryptie
- Overweeg Supabase Vault voor extra gevoelige data

### 1.2 Toegangsbeheer (IAM)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Role-Based Access Control (RBAC)** | Rollen: admin, medewerker, coordinator, coach, fighter, fan | ✅ |
| **Row Level Security (RLS)** | Supabase RLS policies op alle tabellen | ✅ |
| **Multi-Factor Authenticatie (MFA)** | Verplicht voor beheerdersaccounts | ⬜ |
| **Wachtwoord hashing** | Moderne algoritmes (Argon2/BCrypt) - Supabase Auth | ✅ |
| **Session management** | Veilige JWT tokens met expiratie | ✅ |

**Rollen hiërarchie:**
```
admin         → Volledige toegang, kan alles
medewerker    → Leden beheer, check-ins, geen financiën
coordinator   → Rooster, groepen, communicatie
coach         → Eigen lessen zien, aanwezigheid
fighter       → Eigen profiel, check-in (met actief abo)
fan           → Alleen bekijken, geen gym toegang
```

### 1.3 Logging & Monitoring

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Audit logging** | Wie heeft wanneer welke data ingezien/gewijzigd | ⬜ |
| **Geen gevoelige data in logs** | PII nooit in leesbare vorm loggen | ⬜ |
| **Log retentie beleid** | Logs automatisch verwijderen na X maanden | ⬜ |
| **Anomalie detectie** | Waarschuwingen bij verdacht gedrag | ⬜ |

**Implementatie suggestie:**
```sql
-- Audit log tabel
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,        -- 'view', 'create', 'update', 'delete'
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GEEN gevoelige data opslaan in changes kolom
```

### 1.4 Anonymisatie & Pseudonimisatie

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Statistieken anoniem** | Gebruik geanonimiseerde data voor rapporten | ⬜ |
| **Pseudonimisatie optie** | Mogelijkheid om PII te pseudonimiseren | ⬜ |
| **Data minimalisatie** | Alleen noodzakelijke data verzamelen | ✅ |

### 1.5 Back-up & Disaster Recovery

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Versleutelde back-ups** | Alle back-ups encrypted opslaan | ✅ |
| **Regelmatige back-ups** | Minimaal dagelijks (Supabase: automatisch) | ✅ |
| **Disaster recovery test** | Periodiek testen of data hersteld kan worden | ⬜ |
| **Back-up retentie** | Duidelijk beleid voor back-up bewaring | ⬜ |
| **Geografische spreiding** | Back-ups in verschillende regio's | ⬜ |

**Supabase-specifiek:**
- Automatische dagelijkse back-ups ✅
- Point-in-time recovery beschikbaar (Pro plan)
- Back-ups zijn encrypted at rest

---

## 2. Functionele Checklist

### 2.1 Self-Service Portaal (Inzagerecht - Art. 15 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Profiel inzien** | Sporter kan eigen gegevens bekijken | ✅ |
| **Profiel bewerken** | Sporter kan eigen gegevens corrigeren | ✅ |
| **Abonnementen inzien** | Overzicht van actieve/historische abonnementen | ✅ |
| **Check-in historie** | Overzicht van gym bezoeken | ✅ |

### 2.2 Dataportabiliteit (Art. 20 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Export functie** | Data export in machine-leesbaar formaat | ⬜ |
| **JSON export** | Alle persoonlijke data in JSON | ⬜ |
| **CSV export** | Tabellaire data in CSV | ⬜ |
| **Download knop** | Eenvoudige UI voor data download | ⬜ |

**Implementatie suggestie:**
```typescript
// Endpoint: /api/member/export
// Exporteert alle data van een lid:
// - Profiel gegevens
// - Abonnementen historie
// - Check-in historie
// - Gordel promoties
// - Reserveringen
```

### 2.3 Verwijderingsprotocol (Recht op vergetelheid - Art. 17 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Account verwijderen** | Lid kan account volledig verwijderen | ⬜ |
| **Harde verwijdering** | Echte DELETE, niet soft-delete | ⬜ |
| **Back-up opschoning** | Data ook uit back-ups verwijderen (na retentie periode) | ⬜ |
| **Bevestiging** | Bevestigingsmail na verwijdering | ⬜ |
| **Wachttijd** | 30 dagen grace period voor herroeping | ⬜ |

**Let op:** Sommige data mag/moet bewaard blijven:
- Financiële transacties (wettelijke bewaarplicht 7 jaar in België)
- Geanonimiseerde statistieken

### 2.4 Bewaartermijnen (Art. 5 GDPR - Opslagbeperking)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Bewaartermijn beleid** | Gedocumenteerd per data categorie | ⬜ |
| **Automatische waarschuwing** | Alert voor data die termijn nadert | ⬜ |
| **Automatische opschoning** | Scheduled job voor data cleanup | ⬜ |
| **Inactieve leden** | Beleid voor leden die X jaar inactief zijn | ⬜ |

**Voorgestelde bewaartermijnen:**
| Data type | Bewaartermijn | Reden |
|-----------|---------------|-------|
| Actieve leden | Zolang actief | Noodzakelijk voor dienstverlening |
| Inactieve leden | 2 jaar na laatste activiteit | Heractivatie mogelijkheid |
| Financiële data | 7 jaar | Belgische wettelijke verplichting |
| Check-in logs | 1 jaar | Statistieken |
| Audit logs | 2 jaar | Security onderzoek |
| Leads (niet geconverteerd) | 6 maanden | Legitiem belang beperkt |

### 2.5 Toestemmingsbeheer (Art. 7 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Consent registratie** | Opslaan wanneer/waarvoor toestemming gegeven | ⬜ |
| **Nieuwsbrief opt-in** | Expliciete toestemming voor marketing | ⬜ |
| **Foto/video toestemming** | Toestemming voor beeldmateriaal | ⬜ |
| **Toestemming intrekken** | Eenvoudig kunnen uitschrijven | ⬜ |
| **Versiehistorie** | Bijhouden welke versie privacy policy geaccepteerd | ⬜ |

**Database suggestie:**
```sql
CREATE TABLE member_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,  -- 'newsletter', 'photos', 'data_processing'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  ip_address INET,
  privacy_policy_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Documentatie & Juridisch

### 3.1 Register van Verwerkingsactiviteiten (Art. 30 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Verwerkingsregister** | Intern overzicht van alle datastromen | ⬜ |
| **Verwerkingsdoelen** | Per data categorie het doel documenteren | ⬜ |
| **Rechtsgrond** | Per verwerking de rechtsgrond vastleggen | ⬜ |
| **Ontvangers** | Lijst van derde partijen die data ontvangen | ⬜ |
| **Internationale transfers** | Documenteren als data buiten EU gaat | ⬜ |

**Template verwerkingsregister:**

| Verwerking | Doel | Rechtsgrond | Data categorieën | Ontvangers | Bewaartermijn |
|------------|------|-------------|------------------|------------|---------------|
| Ledenbeheer | Dienstverlening | Uitvoering overeenkomst | Naam, email, adres, foto | - | Tot 2 jaar na einde lidmaatschap |
| Toegangscontrole | Veiligheid | Gerechtvaardigd belang | Check-in tijdstippen | - | 1 jaar |
| Nieuwsbrief | Marketing | Toestemming | Email | Mailchimp/Resend | Tot intrekking toestemming |
| Betalingen | Facturatie | Wettelijke verplichting | Betalingsgegevens | Mollie/Stripe | 7 jaar |

### 3.2 Privacyverklaring

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Transparante privacyverklaring** | In begrijpelijke taal | ⬜ |
| **Beschikbaar op website** | Publiek toegankelijk | ⬜ |
| **Bij inschrijving tonen** | Verplicht lezen voor account aanmaken | ⬜ |
| **Versiehistorie** | Wijzigingen bijhouden | ⬜ |

**Verplichte inhoud privacyverklaring:**
- Identiteit en contactgegevens verwerkingsverantwoordelijke
- Contactgegevens functionaris gegevensbescherming (indien van toepassing)
- Verwerkingsdoelen en rechtsgronden
- Categorieën persoonsgegevens
- Ontvangers of categorieën ontvangers
- Bewaartermijnen
- Rechten van betrokkenen
- Recht om klacht in te dienen bij de toezichthoudende autoriteit
- Of verstrekking wettelijk/contractueel verplicht is

### 3.3 Verwerkersovereenkomst (Art. 28 GDPR)

| Vereiste | Beschrijving | Status |
|----------|--------------|--------|
| **Template verwerkersovereenkomst** | Standaard overeenkomst klaar | ⬜ |
| **Getekend met Supabase** | DPA met hosting provider | ✅ |
| **Getekend met payment provider** | DPA met Stripe/Mollie | ⬜ |
| **Getekend met email provider** | DPA met Resend | ⬜ |
| **Getekend met sportclubs** | Per klant-gym | ⬜ |

**Supabase DPA:** https://supabase.com/privacy (standaard inbegrepen)

---

## 4. Implementatie Status RCN CRM

### Huidige situatie (Januari 2026)

#### Wat al geïmplementeerd is:
- ✅ TLS encryptie (Supabase + Vercel)
- ✅ Wachtwoord hashing (Supabase Auth - BCrypt)
- ✅ Role-Based Access Control (6 rollen)
- ✅ Row Level Security op alle productie tabellen
- ✅ Profiel inzien en bewerken (MemberDetail pagina)
- ✅ Data minimalisatie (alleen noodzakelijke velden)
- ✅ Automatische back-ups (Supabase)
- ✅ Supabase DPA

#### Prioriteit 1 - Kritiek voor productie:
- ⬜ Multi-Factor Authenticatie voor admins
- ⬜ Audit logging implementeren
- ⬜ Privacyverklaring op website
- ⬜ Toestemmingsbeheer (consent tabel + UI)

#### Prioriteit 2 - Binnen 3 maanden na launch:
- ⬜ Data export functie (JSON/CSV)
- ⬜ Account verwijderen functionaliteit
- ⬜ Bewaartermijnen automatiseren
- ⬜ Verwerkingsregister documenteren

#### Prioriteit 3 - Voor multi-tenant launch:
- ⬜ Verwerkersovereenkomst template
- ⬜ Per-tenant data isolatie validatie
- ⬜ DPA's met alle subverwerkers

---

## 5. Verwerkersovereenkomst Template

> **Gebruik:** Te tekenen tussen software-ontwikkelaar/hoster (RCN CRM) en de sportclub.

### Concept Verwerkersovereenkomst

---

**VERWERKERSOVEREENKOMST**

**Tussen:**

**Verwerkingsverantwoordelijke:**
[Naam Sportclub]
[Adres]
[KBO/BTW nummer]
Hierna: "de Club"

**Verwerker:**
[RCN CRM / Reconnect Academy]
[Adres]
[KBO/BTW nummer]
Hierna: "de Verwerker"

---

**Artikel 1 - Definities**

1.1 **Persoonsgegevens:** Alle informatie over een geïdentificeerde of identificeerbare natuurlijke persoon.

1.2 **Verwerking:** Elke bewerking van persoonsgegevens (verzamelen, opslaan, wijzigen, raadplegen, verstrekken, wissen, etc.).

1.3 **Datalek:** Een inbreuk op de beveiliging die leidt tot vernietiging, verlies, wijziging of ongeoorloofde toegang tot persoonsgegevens.

---

**Artikel 2 - Onderwerp en duur**

2.1 De Verwerker verwerkt persoonsgegevens uitsluitend ten behoeve van de Club in het kader van het leveren van CRM-software voor ledenbeheer.

2.2 Deze overeenkomst geldt zolang de Club gebruik maakt van de software.

---

**Artikel 3 - Categorieën persoonsgegevens**

De Verwerker verwerkt de volgende categorieën:
- Identificatiegegevens (naam, geboortedatum, geslacht)
- Contactgegevens (email, telefoon, adres)
- Financiële gegevens (abonnementen, betalingshistorie)
- Gezondheidsgegevens (enkel indien door Club ingevoerd, bijv. blessures)
- Bezoekgegevens (check-ins)

---

**Artikel 4 - Verplichtingen van de Verwerker**

4.1 **Instructies:** De Verwerker verwerkt persoonsgegevens alleen op basis van schriftelijke instructies van de Club.

4.2 **Geheimhouding:** Alle personen die toegang hebben tot persoonsgegevens zijn gebonden aan geheimhouding.

4.3 **Beveiliging:** De Verwerker treft passende technische en organisatorische maatregelen:
- Encryptie van data in rust en transport
- Toegangscontrole (RBAC)
- Regelmatige beveiligingstests
- Incidentresponse procedures

4.4 **Subverwerkers:** De Club geeft algemene toestemming voor het inschakelen van subverwerkers:
- Supabase Inc. (database hosting, EU regio)
- Vercel Inc. (applicatie hosting)
- [Payment provider] (betalingen)

De Verwerker informeert de Club bij wijziging van subverwerkers.

4.5 **Bijstand:** De Verwerker helpt de Club bij:
- Uitoefenen van rechten door betrokkenen
- Meldingen van datalekken
- DPIA's (indien nodig)

---

**Artikel 5 - Datalekken**

5.1 De Verwerker meldt een datalek binnen 24 uur na ontdekking aan de Club.

5.2 De melding bevat minimaal:
- Aard van het incident
- Getroffen categorieën en aantallen
- Waarschijnlijke gevolgen
- Genomen maatregelen

---

**Artikel 6 - Audits**

6.1 De Club heeft recht op audit van de beveiligingsmaatregelen.

6.2 De Verwerker stelt certificeringen en auditrapporten beschikbaar (indien aanwezig).

---

**Artikel 7 - Beëindiging**

7.1 Na beëindiging verwijdert de Verwerker alle persoonsgegevens binnen 30 dagen.

7.2 Op verzoek levert de Verwerker eerst een export van alle data in machine-leesbaar formaat.

---

**Artikel 8 - Aansprakelijkheid**

8.1 De Verwerker is aansprakelijk voor schade veroorzaakt door niet-naleving van deze overeenkomst of de AVG.

8.2 De aansprakelijkheid is beperkt tot het bedrag van de door de Club betaalde vergoedingen in de 12 maanden voorafgaand aan het incident.

---

**Artikel 9 - Toepasselijk recht**

9.1 Op deze overeenkomst is Belgisch recht van toepassing.

9.2 Geschillen worden voorgelegd aan de rechtbanken van [Aalst/Dendermonde].

---

**Ondertekening:**

| Verwerkingsverantwoordelijke | Verwerker |
|------------------------------|-----------|
| Naam: | Naam: |
| Functie: | Functie: |
| Datum: | Datum: |
| Handtekening: | Handtekening: |

---

## 6. Nuttige Links & Referenties

- [Gegevensbeschermingsautoriteit België](https://www.gegevensbeschermingsautoriteit.be/)
- [GBA - Model verwerkingsregister](https://www.gegevensbeschermingsautoriteit.be/burger/thema-s/verantwoordingsplicht/verwerkingsregister)
- [GDPR Tekst](https://gdpr.eu/tag/gdpr/)
- [Supabase Privacy Policy & DPA](https://supabase.com/privacy)
- [Vercel DPA](https://vercel.com/legal/dpa)

---

## Changelog

| Datum | Wijziging | Door |
|-------|-----------|------|
| 2026-01-14 | Initiële versie | Claude |

---

*Dit document is een levend document en moet regelmatig worden bijgewerkt naarmate de implementatie vordert.*

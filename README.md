# VisitaUp

Piattaforma di gestione agenda, pazienti e prenotazioni online per professionisti della nutrizione, ispirata a MioDottore.it.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS) — hosting su **Vercel**
- **Supabase** (Postgres + Auth + Row Level Security) come backend
- **Stripe** per pagamenti visite e abbonamenti SaaS dei dottori
- **Resend** o **Brevo** per email transazionali (adapter intercambiabile)
- **Meta Graph API** (Instagram/Facebook) per pubblicazione automatica articoli

## Ruoli

- `superadmin`: attiva nuovi dottori tramite invito, gestisce la piattaforma (`/admin`)
- `doctor` / `staff`: gestiscono agenda, pazienti, prestazioni, disponibilità, articoli (`/dottore`)
- `patient`: prenota visite e consulta i propri appuntamenti (`/area-personale`)

## Setup locale

```bash
npm install
cp .env.example .env.local   # poi compila le chiavi mancanti
npm run dev
```

## Database

Lo schema vive in `supabase/migrations/0001_init.sql` ed è già applicato al progetto
Supabase `VisitaUp` (ref `atxltofpzuhschgehsqx`). Per rigenerare i tipi TypeScript da uno
schema aggiornato:

```bash
npx supabase gen types typescript --project-id atxltofpzuhschgehsqx > src/lib/types/database.ts
```

### Creare il primo superadmin

Dopo essersi registrati come paziente (o essere stati creati come dottore), promuovere
manualmente l'utente da SQL Editor su Supabase:

```sql
update public.profiles set role = 'superadmin' where id = '<uuid-utente>';
```

## Variabili d'ambiente

Vedi `.env.example` per l'elenco completo. Le principali:

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret, solo server) |
| `RESEND_API_KEY` o `BREVO_API_KEY` | Dashboard del provider email scelto |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | Stripe → Product Catalog (Price ID degli abbonamenti dottore) |
| `CRON_SECRET` | Stringa a piacere, usata per proteggere `/api/cron/reminders` |

## Deploy su Vercel

1. Importa il repository GitHub in Vercel (Add New Project → Import Git Repository)
2. Imposta le variabili d'ambiente sopra elencate nel pannello Vercel (Settings → Environment Variables)
3. Il file `vercel.json` configura già un Cron Job orario che invia i promemoria email 24h prima degli appuntamenti
4. Configura il webhook Stripe su `https://<tuo-dominio>/api/stripe/webhook` (eventi: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`)

## Note implementative

- Le videoconsulenze usano link **Jitsi Meet** generati automaticamente (nessuna API key richiesta). Sostituibile in futuro con Zoom/Google Meet via OAuth per-dottore.
- La pubblicazione social richiede che ogni dottore colleghi manualmente Page ID/Access Token da `/dottore/articoli` (richiede una Meta App con permessi `pages_manage_posts` e `instagram_content_publish`).
- I pagamenti Stripe sono già cablati per: caparra/pagamento visita (checkout one-off) e abbonamento SaaS dottore (checkout subscription).

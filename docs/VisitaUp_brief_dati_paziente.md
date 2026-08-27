# VisitaUp — Brief sviluppo: dati paziente + BIA (contesto per Claude Code)

Il wearable NON fa parte di questo lavoro (vedi "Fuori scope").

## Progetto

VisitaUp — piattaforma per nutrizionisti e medici. Stack: Supabase (progetto `atxltofpzuhschgehsqx`, region `eu-west-1`) → Vercel → GitHub.

Convenzioni da rispettare (leggere le migration/tabelle esistenti per i dettagli): multi-tenant, dati scopati per `doctor_id`, RLS attiva su tutte le tabelle. Ogni tabella nuova va legata a `patients` e deve seguire lo stesso pattern RLS/`doctor_id` delle tabelle già presenti (es. `appointments` tiene sia `doctor_id` sia `patient_id`).

## Scope di questo lavoro

Due sole sezioni, entrambe consolidate:

1. Dati paziente in-app — storico diete, andamento peso, massa magra/grassa, circonferenze, diario alimentare, allergeni e intolleranze.
2. Impedenziometria / BIA — import CSV (Akern) o inserimento manuale guidato dei valori chiave.

Insight chiave: le due sezioni condividono lo stesso dato. Andamento peso e massa magra/grassa (sez. 1) e i valori BIA (sez. 2) sono la stessa misurazione corporea: cambia solo il metodo di inserimento (manuale vs import CSV). Un solo modello `misurazioni`, non due.

## Modello dati proposto (da implementare come migration)

Tutte le tabelle: `patient_id` FK → `patients`, timestamp, RLS per `doctor_id`.

- `misurazioni` — una riga per rilevazione. Copre sia l'andamento peso/massa (sez. 1) sia i valori BIA (sez. 2). Campi: `data`, `peso_kg`, `massa_grassa_kg`, `massa_grassa_perc`, `massa_magra_kg`, `massa_muscolare_kg`, `acqua_perc`, `acqua_kg`, `fonte` (enum: `manuale` | `csv_bia` | `akern`), `note`. (Memorizzare sia % sia kg dove disponibili; Akern in genere fornisce entrambi.)
- `circonferenze` — `data` + colonne per punto di misura (es. vita, fianchi, braccio, coscia, polpaccio, collo). Decisione da confermare: tabella separata (proposta) oppure colonne dentro `misurazioni`.
- `piani_alimentari` — storico diete caricate manualmente. Campi: `titolo`, `data_inizio`, `data_fine`, `file_url` (Supabase Storage), `note`. Serve un bucket Storage con RLS per i PDF.
- `diario_alimentare` — `data`, `pasto` (colazione/pranzo/cena/spuntino), `contenuto`, `aderenza`, `note`.
- `allergeni_intolleranze` — una riga per voce: `tipo` (allergene | intolleranza), `sostanza`, `gravita`, `note`.

## Funzionalità da costruire lato medico

- Form di inserimento manuale di una misurazione (scrive in `misurazioni`).
- Import CSV BIA (Akern): il paziente/nutrizionista carica il CSV, si mappano le colonne sui campi di `misurazioni`, con anteprima e conferma prima di salvare. NON hardcodare il tracciato: il formato colonne varia per software/modello Akern → costruire un mapper e verificarlo su un export reale (chiedere un CSV campione al committente).
- Upload e gestione dei piani alimentari (file su Storage + riga metadati).
- Diario alimentare e gestione allergeni/intolleranze (CRUD semplice) editabile lato medico e lato paziente.
- Dashboard paziente: legge tutte queste tabelle e mostra i grafici di andamento (peso, massa magra/grassa nel tempo da `misurazioni`), l'elenco dei piani, le voci del diario e allergeni/intolleranze.

## Fuori scope (per ora)

- Wearable / braccialetto JCVital 2208A: rimandato in attesa della risposta dell'azienda. Non implementare nulla di attività/passi ora.
- Bilancia Withings (automazione della massa grassa via API cloud): possibile evoluzione futura, non in questo lavoro. La tabella `misurazioni` è però già predisposta ad accoglierla in futuro tramite il campo `fonte`.

## Decisioni da confermare col committente prima di fissare lo schema

- Circonferenze: tabella separata o colonne in `misurazioni`?
- Piani alimentari: solo file PDF caricato, o anche testo strutturato?
- Campi di `misurazioni`: l'elenco sopra è completo o va aggiunto/tolto qualcosa?

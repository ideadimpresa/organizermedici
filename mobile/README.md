# VisitaUp Mobile (iOS/Android shell)

## Perché serve un'app nativa (e non basta questa webapp)

Il braccialetto VisitaUp Band parla Bluetooth Low Energy (BLE). Per leggere i
suoi dati un browser deve usare l'API **Web Bluetooth**:

- **Android (Chrome/Edge)**: Web Bluetooth funziona. In teoria un paziente
  Android potrebbe sincronizzare il braccialetto direttamente da questa
  webapp, installata come PWA, senza nessuna app nativa.
- **iPhone (qualsiasi browser)**: Web Bluetooth **non esiste** su iOS. Non è
  un limite di Safari che un altro browser possa evitare: su iOS ogni browser
  (Chrome, Firefox, ecc.) è obbligato da Apple a usare il motore WebKit, e
  WebKit non implementa Web Bluetooth, punto. Nessuna quantità di sviluppo
  lato webapp può aggirarlo.

Dato che il braccialetto va dato in dotazione a qualsiasi paziente —
indipendentemente dal telefono che ha — serve per forza un involucro nativo
(o hybrid) almeno per iOS. Questa cartella è quell'involucro, basato su
**Capacitor**: non è una riscrittura dell'app, è un contenitore nativo che:

1. Carica la webapp Next.js già esistente (stessa UI, stesso codice, stesso
   backend) dentro una WebView nativa.
2. Espone alla pagina un plugin nativo di BLE (`@capacitor-community/bluetooth-le`)
   che Web Bluetooth su iOS non può darci.

Risultato: un solo progetto Next.js da mantenere; la parte nativa è solo un
sottile ponte per il Bluetooth. Lo shippiamo anche su Android (anche se lì la
PWA pura funzionerebbe) per avere presenza sugli store e UX identica sui due
sistemi.

## Cosa è già pronto in questa cartella

- `capacitor.config.ts` — punta alla webapp in produzione (`server.url`),
  così l'app nativa è sempre sincronizzata con l'ultimo deploy Vercel senza
  bisogno di una nuova build per ogni modifica al sito.
- `src/wearable-provider.ts` — l'interfaccia `WearableProvider` (già decisa
  in una conversazione precedente) con cui il ponte nativo parlerà al resto
  del codice, indipendentemente dal vendor del braccialetto (Staranb,
  Joint Corp, o chi vincerà il confronto). Contiene uno stub
  `StaranbProvider` che lancia un errore esplicito finché non viene
  implementato.

## Cosa resta bloccato (non è una scelta architetturale, è un dato mancante)

Il protocollo BLE specifico di Staranb/Joint Corp — UUID di servizio e
caratteristiche, formato dei comandi, formato dei pacchetti di
passi/calorie/sessioni — non è pubblico: arriva solo con l'SDK che il
fornitore deve ancora mandare. `StaranbProvider.connect()` e
`StaranbProvider.readActivity()` restano `throw new Error("SDK non ancora
disponibile")` finché quell'SDK non arriva. Appena arriva, il lavoro è
isolato in quel singolo file: tutto il resto (interfaccia, shell nativa,
endpoint di sync `/api/wearable/sync`, UI) è già pronto a riceverne i dati.

## Setup (da fare su una macchina con Xcode/Android Studio — non in questo container cloud)

```bash
cd mobile
npm install
npx cap add ios       # richiede Xcode (macOS)
npx cap add android    # richiede Android Studio
npx cap sync
```

Poi apri `ios/App/App.xcworkspace` in Xcode o `android/` in Android Studio
per build e firma. Questo container cloud non ha i toolchain nativi, quindi
questi comandi vanno eseguiti su un Mac (per iOS) o su una macchina con
Android Studio — non qui.

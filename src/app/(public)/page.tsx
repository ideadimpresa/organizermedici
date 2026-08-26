import Link from "next/link";

const FEATURES = [
  {
    title: "Agenda intelligente",
    description:
      "Calendario mensile, appuntamenti in studio o online e riepilogo settimanale: gestisci ogni visita senza telefonate a vuoto.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "CRM pazienti",
    description:
      "Anagrafica completa, storico visite e importazione da file esistenti: la tua banca dati clienti sempre a portata di mano.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 5.5c1.7.4 3 2 3 3.9s-1.3 3.5-3 3.9M19 20c0-2.6-1.6-4.8-3.8-5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Pagamenti online",
    description: "Caparre e pagamenti delle visite direttamente dal profilo del paziente, senza gestire contanti o solleciti.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Contenuti & social",
    description: "Pubblica articoli sul tuo profilo e condividili automaticamente su Instagram e Facebook per farti trovare.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <path d="M5 4h14v13l-4-2H5V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 8.5h8M8 12h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const STEPS = [
  { n: "01", title: "Richiedi l'attivazione", description: "Ti contattiamo per attivare il tuo profilo professionale verificato." },
  { n: "02", title: "Configura il tuo studio", description: "Imposta orari, indirizzi, prestazioni e prezzi in pochi minuti." },
  { n: "03", title: "Ricevi prenotazioni", description: "I pazienti prenotano online, tu gestisci tutto da un'unica dashboard." },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-button bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-aqua">
            La piattaforma per i professionisti della nutrizione
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold text-white sm:text-5xl">
            Agenda, pazienti, pagamenti e contenuti. Un unico studio digitale.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">
            VisitaUp è il software gestionale pensato per nutrizionisti e biologi nutrizionisti: meno tempo
            organizzativo, più tempo per i tuoi pazienti.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/per-professionisti"
              className="rounded-button bg-teal px-6 py-3 font-semibold text-white hover:bg-teal-dark"
            >
              Attiva il tuo profilo
            </Link>
            <Link
              href="/dottori"
              className="rounded-button border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Sei un paziente? Trova un nutrizionista
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">Tutto quello che serve al tuo studio</h2>
          <p className="mt-2 text-secondary">Una sola piattaforma al posto di agenda cartacea, fogli Excel e messaggi sparsi.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-5 shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-card bg-teal">{f.icon}</div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-secondary">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-aqua-light/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold">Come funziona</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="text-3xl font-bold text-teal">{s.n}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-secondary">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">Pronto a digitalizzare il tuo studio?</h2>
        <p className="mx-auto mt-2 max-w-xl text-secondary">
          L&apos;attivazione dei profili professionali avviene tramite il nostro team, per garantire qualità e
          verifica su tutta la piattaforma.
        </p>
        <div className="mt-6">
          <Link
            href="/per-professionisti"
            className="inline-block rounded-button bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Scopri come attivarti
          </Link>
        </div>
      </section>
    </div>
  );
}

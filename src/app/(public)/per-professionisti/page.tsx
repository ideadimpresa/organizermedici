export default function PerProfessionistiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">VisitaUp per professionisti della nutrizione</h1>
      <p className="mt-4 text-black/70">
        Gestisci agenda, pazienti e comunicazione social in un&apos;unica piattaforma. L&apos;attivazione
        del profilo professionale avviene tramite invito diretto del nostro team, per garantire
        qualità e verifica dei professionisti presenti sulla piattaforma.
      </p>
      <div className="mt-8 rounded-xl border border-black/10 bg-white p-6">
        <h2 className="font-semibold">Cosa include</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-black/70">
          <li>Agenda online con appuntamenti in studio e consulenze a distanza</li>
          <li>Gestione anagrafica pazienti con import da file esistenti</li>
          <li>Promemoria automatici via email per te e per i pazienti</li>
          <li>Pagamenti online e caparre per le visite</li>
          <li>Pubblicazione articoli e contenuti, con condivisione automatica sui social</li>
        </ul>
      </div>
      <p className="mt-8 text-black/70">
        Scrivici per richiedere l&apos;attivazione del tuo profilo:{" "}
        <a className="text-brand underline" href="mailto:hello@visitaup.it">
          hello@visitaup.it
        </a>
      </p>
    </div>
  );
}

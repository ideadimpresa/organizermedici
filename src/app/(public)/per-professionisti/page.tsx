export default function PerProfessionistiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">VisitaUp per professionisti della nutrizione</h1>
      <p className="mt-4 text-foreground">
        Gestisci agenda, pazienti e comunicazione social in un&apos;unica piattaforma. L&apos;attivazione
        del profilo professionale avviene tramite invito diretto del nostro team, per garantire
        qualità e verifica dei professionisti presenti sulla piattaforma.
      </p>
      <div className="mt-8 rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-6">
        <h2 className="font-semibold">Cosa include</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-foreground">
          <li>Agenda online con appuntamenti in studio e consulenze a distanza</li>
          <li>Gestione anagrafica pazienti con import da file esistenti</li>
          <li>Messaggistica diretta con i pazienti, storico misurazioni e diario alimentare</li>
          <li>Diario fotografico con stima automatica di calorie e macronutrienti via AI</li>
          <li>Promemoria automatici via email per te e per i pazienti</li>
          <li>Pagamenti online e caparre per le visite</li>
          <li>Pubblicazione articoli e contenuti, con condivisione automatica sui social</li>
        </ul>
      </div>

      <div className="mt-6 rounded-card border border-border border-l-4 border-l-teal bg-surface shadow-card p-6">
        <h2 className="font-semibold">Pensata anche per i percorsi GLP-1</h2>
        <p className="mt-2 text-foreground">
          Sempre più pazienti arrivano in studio in terapia con farmaci GLP-1 (semaglutide, tirzepatide):
          servono un monitoraggio più frequente dell&apos;aderenza, attenzione alla preservazione della
          massa magra e un canale diretto per segnalare effetti collaterali tra una visita e l&apos;altra.
          VisitaUp aggiunge un coaching ibrido medico+AI: l&apos;AI fa da prima lettura (diario fotografico,
          promemoria su proteine e sazietà), tu resti sempre al centro delle decisioni cliniche.
        </p>
      </div>
      <p className="mt-8 text-foreground">
        Scrivici per richiedere l&apos;attivazione del tuo profilo:{" "}
        <a className="text-brand underline" href="mailto:hello@visitaup.it">
          hello@visitaup.it
        </a>
      </p>
    </div>
  );
}

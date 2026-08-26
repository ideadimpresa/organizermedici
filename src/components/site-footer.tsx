export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-secondary">
        <p>&copy; {new Date().getFullYear()} VisitaUp. Tutti i diritti riservati.</p>
        <p className="mt-1">
          <a href="/privacy" className="hover:text-brand">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="/termini" className="hover:text-brand">
            Termini di servizio
          </a>
        </p>
      </div>
    </footer>
  );
}

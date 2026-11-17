interface Messaggio {
  id: string;
  mittente: "medico" | "paziente";
  testo: string;
  created_at: string;
}

export function MessageThread({ messaggi, viewAs }: { messaggi: Messaggio[]; viewAs: "medico" | "paziente" }) {
  return (
    <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-card border border-border bg-background p-4">
      {messaggi.map((m) => {
        const isOwn = m.mittente === viewAs;
        return (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-card px-4 py-2 text-sm ${
              isOwn ? "self-end bg-brand text-white" : "self-start border border-border bg-surface"
            }`}
          >
            <p className="whitespace-pre-line">{m.testo}</p>
            <p className={`mt-1 text-xs ${isOwn ? "text-white/70" : "text-muted"}`}>
              {new Date(m.created_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        );
      })}
      {messaggi.length === 0 && <p className="py-6 text-center text-sm text-secondary">Nessun messaggio. Scrivi il primo!</p>}
    </div>
  );
}

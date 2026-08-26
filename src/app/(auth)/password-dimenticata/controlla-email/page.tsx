export default function CheckEmailForResetPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Controlla la tua email</h1>
      <p className="mt-3 text-secondary">
        Se l&apos;indirizzo corrisponde a un account, riceverai a breve un&apos;email con un link per impostare una
        nuova password. Il link è valido per un tempo limitato.
      </p>
    </div>
  );
}

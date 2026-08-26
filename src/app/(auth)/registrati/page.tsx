import Link from "next/link";
import { signupPatient } from "../actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold">Crea il tuo account paziente</h1>
      <p className="mt-1 text-center text-sm text-black/60">
        Prenota visite e gestisci i tuoi appuntamenti online
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form action={signupPatient} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Nome e cognome</label>
          <input
            type="text"
            name="full_name"
            required
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-brand py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          Registrati
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-black/60">
        Hai già un account?{" "}
        <Link href="/login" className="text-brand underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}

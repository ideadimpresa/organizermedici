import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold">Password dimenticata</h1>
      <p className="mt-1 text-center text-sm text-secondary">
        Inserisci la tua email: se corrisponde a un account, ti mandiamo un link per reimpostare la password.
      </p>

      <form action={requestPasswordReset} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-button bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Invia link di reset
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        <Link href="/login" className="text-brand underline">
          Torna al login
        </Link>
      </p>
    </div>
  );
}

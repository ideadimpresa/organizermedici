import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold">Accedi al tuo account</h1>
      <p className="mt-1 text-center text-sm text-secondary">Pazienti, professionisti e staff</p>

      {error && (
        <p className="mt-4 rounded-lg bg-error-light px-4 py-2 text-sm text-error">{error}</p>
      )}

      <form action={login} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next || "/"} />
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-button bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Login
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Non hai ancora un account?{" "}
        <Link href="/registrati" className="text-brand underline">
          Registrati
        </Link>
      </p>
    </div>
  );
}

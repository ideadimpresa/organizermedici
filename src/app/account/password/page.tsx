import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { updatePassword } from "@/app/(auth)/actions";

export default async function AccountPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/password");

  const { error, success, reset } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold">{reset ? "Imposta una nuova password" : "Cambia password"}</h1>
      <p className="mt-1 text-center text-sm text-secondary">{user.email}</p>

      {error && <p className="mt-4 rounded-lg bg-error-light px-4 py-2 text-sm text-error">{error}</p>}
      {success && (
        <p className="mt-4 rounded-lg bg-success-light px-4 py-2 text-sm text-success">Password aggiornata con successo.</p>
      )}

      <form action={updatePassword} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Nuova password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Conferma nuova password</label>
          <input
            type="password"
            name="confirm"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 focus:border-brand focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-button bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Salva nuova password
        </button>
      </form>
    </div>
  );
}

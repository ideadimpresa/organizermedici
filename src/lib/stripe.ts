import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  if (!stripeSingleton) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY non configurata");
    }
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}

/** Prezzo Stripe (Price ID) per l'abbonamento SaaS del dottore, per piano. */
export const DOCTOR_PLAN_PRICE_IDS: Record<"starter" | "pro", string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
};

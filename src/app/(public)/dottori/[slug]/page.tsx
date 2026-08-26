import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingWidget } from "@/components/booking-widget";

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: doctor } = await supabase.from("doctors").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!doctor) notFound();

  const [{ data: services }, { data: addresses }] = await Promise.all([
    supabase.from("services").select("*").eq("doctor_id", doctor.id).eq("is_active", true),
    supabase.from("addresses").select("*").eq("doctor_id", doctor.id).eq("is_active", true),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 rounded-full bg-brand-light" />
              <div>
                <h1 className="text-xl font-bold">{doctor.display_name}</h1>
                <p className="text-secondary">{doctor.title}</p>
                {addresses && addresses[0] && (
                  <p className="mt-1 text-sm text-secondary">
                    {addresses[0].city} · {addresses.length} indirizzo{addresses.length > 1 ? "i" : ""}
                  </p>
                )}
              </div>
            </div>

            {doctor.bio && (
              <div className="mt-6">
                <h2 className="font-semibold">Esperienze</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">{doctor.bio}</p>
              </div>
            )}

            {doctor.conditions_treated?.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold">Principali patologie trattate</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {doctor.conditions_treated.map((c: string) => (
                    <span key={c} className="rounded-full border border-brand/30 bg-brand-light px-3 py-1 text-xs text-brand-dark">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(doctor.social_instagram || doctor.social_facebook || doctor.social_tiktok) && (
              <div className="mt-6 flex gap-4 text-sm">
                {doctor.social_instagram && (
                  <a href={doctor.social_instagram} target="_blank" className="text-brand hover:underline">
                    Instagram
                  </a>
                )}
                {doctor.social_facebook && (
                  <a href={doctor.social_facebook} target="_blank" className="text-brand hover:underline">
                    Facebook
                  </a>
                )}
                {doctor.social_tiktok && (
                  <a href={doctor.social_tiktok} target="_blank" className="text-brand hover:underline">
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <BookingWidget
            doctorId={doctor.id}
            doctorName={doctor.display_name}
            services={services || []}
            addresses={addresses || []}
          />
        </div>
      </div>
    </div>
  );
}

// Hand-authored types mirroring supabase/migrations/0001_init.sql.
// Once the Supabase project is live, replace with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts

export type Role = "superadmin" | "doctor" | "staff" | "patient";
export type AppointmentMode = "studio" | "online";
export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "not_required";
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type DoctorPlan = "trial" | "starter" | "pro";
export type ArticleStatus = "draft" | "published";
export type SocialPlatform = "instagram" | "facebook";
export type SocialPostStatus = "pending" | "posted" | "failed";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type MisurazioneFonte = "manuale" | "csv_bia" | "akern";
export type PastoTipo = "colazione" | "pranzo" | "cena" | "spuntino" | "giornata";
export type AllergiaTipo = "allergene" | "intolleranza";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          profile_id: string | null;
          slug: string;
          display_name: string;
          title: string;
          bio: string | null;
          specializations: string[];
          conditions_treated: string[];
          phone: string | null;
          contact_email: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          social_instagram: string | null;
          social_facebook: string | null;
          social_tiktok: string | null;
          plan: DoctorPlan;
          subscription_status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["doctors"]["Row"]> & {
          slug: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctors"]["Row"]>;
        Relationships: [];
      };
      doctor_invites: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          invited_by: string | null;
          token: string;
          status: InviteStatus;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["doctor_invites"]["Row"]> & { email: string };
        Update: Partial<Database["public"]["Tables"]["doctor_invites"]["Row"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          doctor_id: string;
          label: string;
          address_line: string;
          city: string;
          postal_code: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & {
          doctor_id: string;
          address_line: string;
          city: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          doctor_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price_cents: number;
          mode: "studio" | "online" | "both";
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          doctor_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          doctor_id: string;
          address_id: string | null;
          mode: AppointmentMode;
          weekday: number;
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["availability_rules"]["Row"]> & {
          doctor_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_rules"]["Row"]>;
        Relationships: [];
      };
      availability_exceptions: {
        Row: {
          id: string;
          doctor_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          is_blocked: boolean;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["availability_exceptions"]["Row"]> & {
          doctor_id: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_exceptions"]["Row"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          doctor_id: string;
          profile_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          fiscal_code: string | null;
          birth_date: string | null;
          notes: string | null;
          tags: string[];
          source: "manual" | "import" | "booking";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patients"]["Row"]> & {
          doctor_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Row"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          service_id: string | null;
          address_id: string | null;
          mode: AppointmentMode;
          starts_at: string;
          ends_at: string;
          status: AppointmentStatus;
          meeting_link: string | null;
          notes: string | null;
          price_cents: number;
          payment_status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string | null;
          doctor_id: string;
          patient_id: string | null;
          amount_cents: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          status: "pending" | "succeeded" | "failed" | "refunded";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          doctor_id: string;
          amount_cents: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          doctor_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_url: string | null;
          status: ArticleStatus;
          auto_publish_social: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["articles"]["Row"]> & {
          doctor_id: string;
          title: string;
          slug: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Row"]>;
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          doctor_id: string;
          platform: SocialPlatform;
          external_account_id: string;
          access_token: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["social_accounts"]["Row"]> & {
          doctor_id: string;
          platform: SocialPlatform;
          external_account_id: string;
          access_token: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_accounts"]["Row"]>;
        Relationships: [];
      };
      social_posts: {
        Row: {
          id: string;
          article_id: string;
          doctor_id: string;
          platform: SocialPlatform;
          status: SocialPostStatus;
          external_post_id: string | null;
          error_message: string | null;
          created_at: string;
          posted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["social_posts"]["Row"]> & {
          article_id: string;
          doctor_id: string;
          platform: SocialPlatform;
        };
        Update: Partial<Database["public"]["Tables"]["social_posts"]["Row"]>;
        Relationships: [];
      };
      reminders_log: {
        Row: {
          id: string;
          appointment_id: string;
          channel: string;
          kind: "confirmation" | "reminder_24h" | "cancellation";
          sent_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reminders_log"]["Row"]> & {
          appointment_id: string;
          kind: "confirmation" | "reminder_24h" | "cancellation";
        };
        Update: Partial<Database["public"]["Tables"]["reminders_log"]["Row"]>;
        Relationships: [];
      };
      misurazioni: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          data: string;
          peso_kg: number | null;
          massa_grassa_kg: number | null;
          massa_grassa_perc: number | null;
          massa_magra_kg: number | null;
          massa_muscolare_kg: number | null;
          acqua_perc: number | null;
          acqua_kg: number | null;
          fonte: MisurazioneFonte;
          file_path: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["misurazioni"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          data: string;
        };
        Update: Partial<Database["public"]["Tables"]["misurazioni"]["Row"]>;
        Relationships: [];
      };
      referti_bia: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          data_esame: string | null;
          file_path: string;
          image_paths: string[];
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["referti_bia"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["referti_bia"]["Row"]>;
        Relationships: [];
      };
      diario_alimentare: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          data: string;
          pasto: PastoTipo;
          contenuto: string;
          aderenza: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["diario_alimentare"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          data: string;
          pasto: PastoTipo;
          contenuto: string;
        };
        Update: Partial<Database["public"]["Tables"]["diario_alimentare"]["Row"]>;
        Relationships: [];
      };
      allergeni_intolleranze: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          tipo: AllergiaTipo;
          sostanza: string;
          gravita: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["allergeni_intolleranze"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          tipo: AllergiaTipo;
          sostanza: string;
        };
        Update: Partial<Database["public"]["Tables"]["allergeni_intolleranze"]["Row"]>;
        Relationships: [];
      };
      piani_alimentari: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          titolo: string;
          data_inizio: string | null;
          data_fine: string | null;
          file_path: string;
          content_text: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["piani_alimentari"]["Row"]> & {
          doctor_id: string;
          patient_id: string;
          titolo: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["piani_alimentari"]["Row"]>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: boolean;
          email_provider: "resend" | "brevo";
          email_from_name: string;
          email_from_address: string | null;
          resend_api_key_encrypted: string | null;
          brevo_api_key_encrypted: string | null;
          stripe_publishable_key: string | null;
          stripe_price_starter: string | null;
          stripe_price_pro: string | null;
          stripe_secret_key_encrypted: string | null;
          stripe_webhook_secret_encrypted: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_role: { Args: Record<string, never>; Returns: string };
      is_superadmin: { Args: Record<string, never>; Returns: boolean };
      current_doctor_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

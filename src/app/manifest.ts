import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VisitaUp",
    short_name: "VisitaUp",
    description: "Agenda, pazienti e prenotazioni online per professionisti della nutrizione.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFC",
    theme_color: "#16324F",
    icons: [
      {
        src: "/icon.png",
        sizes: "293x287",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

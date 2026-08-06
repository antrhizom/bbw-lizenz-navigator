import EdTechUebersicht from "@/components/edtech/EdTechUebersicht";

// Startseite ist der Bestand: die Lizenzübersicht ist der Haupteinstieg.
// Die frühere Startseite liegt unter /paedagogik.
export default function StartPage() {
  return <EdTechUebersicht art="anwendung" />;
}

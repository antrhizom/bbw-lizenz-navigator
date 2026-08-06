import { permanentRedirect } from "next/navigation";

// Frühere Adresse der Lizenzübersicht – bestehende Links und Lesezeichen
// landen weiterhin am richtigen Ort.
export default function LizenzenRedirect() {
  permanentRedirect("/");
}

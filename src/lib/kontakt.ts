/**
 * Kontaktadresse für Support- und Lizenzanfragen.
 * An einer Stelle gepflegt – sie wird im Kopfbereich und in den Hinweisen
 * auf den Bestandsseiten verwendet.
 */
export const KONTAKT = {
  email: "pikt@bbw.ch",
  label: "Support",
  betreff: "Anfrage Lerntechnologie",
  erklaerung:
    "Anfrage an das PIKT-Team – zu Lizenzen, Zugängen, Geräten oder individuellen Lösungen.",
};

/** mailto-Adresse mit vorbelegtem Betreff. */
export function mailtoLink(betreff: string = KONTAKT.betreff): string {
  return `mailto:${KONTAKT.email}?subject=${encodeURIComponent(betreff)}`;
}

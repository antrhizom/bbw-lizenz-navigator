/**
 * Schalter für Inhalte, die noch nicht öffentlich sind.
 *
 * ZUGANG_OEFFENTLICH:
 *   false → «Zugang & Rollen» ist nur für Konten der Admin-Whitelist sichtbar
 *           und im Menü ausgeblendet (Seite noch in Überarbeitung).
 *   true  → für alle sichtbar, Menüpunkt erscheint wieder.
 *
 * Zum Aufschalten genügt es, den Wert auf `true` zu setzen und zu deployen.
 */
export const ZUGANG_OEFFENTLICH = false;

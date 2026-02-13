/* ─── Rollen- und Berechtigungskonzept BBW ─── */

export type AccessLevel =
  | "Admin"
  | "Autor"
  | "Benutzerverw."
  | "Verwalter"
  | "Lesen/Schr."
  | "Lesen"
  | "Nutzer"
  | "Ausleihe"
  | "Gruppenarbeit"
  | "via LP"
  | "Teams-Adm."
  | "SP-Admin"
  | "Exch.-Adm."
  | "Benutzer-Adm."
  | "Intune-Adm."
  | "Lizenz-Adm."
  | "Helpdesk"
  | "Global Reader"
  | "–";

export interface Role {
  id: string;
  label: string;
  shortLabel: string;
  color: string;       // Tailwind bg-class
  textColor: string;   // Tailwind text-class
  description: string;
  responsibilities: string[];
}

export interface SystemCategory {
  id: string;
  title: string;
  icon: string; // SVG path
  accentColor: string;
  accentBg: string;
  description: string;
  systems: {
    name: string;
    detail?: string;
    access: Record<string, AccessLevel>;
  }[];
}

export interface PolicyRule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface ProcessStep {
  step: number;
  actor: string;
  action: string;
}

export interface Process {
  id: string;
  title: string;
  color: string;
  steps: ProcessStep[];
}

// ─── Rollen ───
export const ROLES: Role[] = [
  {
    id: "lernende",
    label: "Lernende",
    shortLabel: "Lern.",
    color: "bg-gray-100",
    textColor: "text-gray-700",
    description: "Schüler:innen der BBW. Zugang zu Lernplattformen und freigegebenen Tools.",
    responsibilities: [
      "Nutzung von Lerninhalten und Lernplattformen",
      "Keine administrativen Rechte",
      "Zugang über Schulkonto",
    ],
  },
  {
    id: "lp",
    label: "Lehrperson (LP)",
    shortLabel: "LP",
    color: "bg-emerald-50",
    textColor: "text-emerald-700",
    description: "Unterrichtende der BBW. Erstellen und verwalten Lerninhalte.",
    responsibilities: [
      "Kursgestaltung und Bewertung",
      "Nutzung von Lerntechnologien",
      "Autor-Rechte in OpenOlat",
      "Verantwortung für Datenschutz gegenüber Lernenden",
    ],
  },
  {
    id: "lernlounge",
    label: "Lernlounge",
    shortLabel: "LL",
    color: "bg-amber-50",
    textColor: "text-amber-700",
    description: "Betreuungspersonen der Lernlounge. Verwalten Ausleihe und Medienarchiv-Zugänge.",
    responsibilities: [
      "Verwaltung: Digithek (Statista, swissdox, E-Thek)",
      "Verwaltung: Actionbound",
      "Ausleihe ChatGPT-Notebook",
    ],
  },
  {
    id: "pikt-team",
    label: "PIKT-Team",
    shortLabel: "PIKT",
    color: "bg-violet-50",
    textColor: "text-violet-700",
    description: "Pädagogischer ICT-Support. Unterstützt LP bei Lerntechnologien.",
    responsibilities: [
      "Verwaltung von Einzellizenzen (Synthesia, Mentimeter, Padlet, Findmind)",
      "Beratung und Inhalterstellung für Lehrpersonen",
      "Kontaktaufnahme für neue Tools",
      "Benutzerverwalter-Rechte in OpenOlat",
    ],
  },
  {
    id: "pikt-leitung",
    label: "PIKT-Leitung",
    shortLabel: "PIKT-L",
    color: "bg-green-100",
    textColor: "text-green-800",
    description: "Leitung des pädagogischen ICT-Supports. Admin-Rechte für Lerntechnologien und OpenOlat.",
    responsibilities: [
      "Administrator: OpenOlat (komplett)",
      "Administrator: alle Kantonslizenzen",
      "Administrator: begrenzte Lizenzen und Einzellizenzen",
      "Global Reader in Microsoft 365 (Lesezugriff)",
      "Strategische Entscheide mit Steuergruppe",
    ],
  },
  {
    id: "tikt-team",
    label: "TIKT-Team",
    shortLabel: "TIKT",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    description: "Technischer ICT-Support. Delegierte Admin-Rechte für Microsoft 365.",
    responsibilities: [
      "Delegierte Admin-Rollen in M365",
      "Teams Administrator, SharePoint Administrator",
      "Exchange Administrator, User Administrator",
      "License Administrator, Intune Administrator",
      "Helpdesk für Passwort-Resets",
    ],
  },
  {
    id: "tikt-leitung",
    label: "TIKT-Leitung",
    shortLabel: "TIKT-L",
    color: "bg-blue-100",
    textColor: "text-blue-800",
    description: "Leitung des technischen ICT-Supports. Globaler Admin Microsoft 365.",
    responsibilities: [
      "Global Administrator Microsoft 365",
      "Entra ID, Security & Compliance",
      "Admin: Adobe Creative Cloud",
      "Vergibt delegierte Rollen an TIKT-Team",
      "Halbjährliche Prüfung aller Admin-Berechtigungen",
    ],
  },
];

// ─── System-Kategorien mit Berechtigungsmatrizen ───
export const SYSTEM_CATEGORIES: SystemCategory[] = [
  {
    id: "openolat",
    title: "OpenOlat",
    icon: "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5",
    accentColor: "bg-teal-600",
    accentBg: "bg-teal-50",
    description: "Lernmanagementsystem und Intranet der BBW. Dient als zentrale Lernorganisationsplattform und für interne Kommunikation.",
    systems: [
      { name: "Kursbereich (Lernorganisation)", detail: "Kurse, Aufgaben, Tests, Bewertungen", access: { lernende: "Lesen", lp: "Lesen/Schr.", lernlounge: "–", "pikt-team": "Lesen", "pikt-leitung": "Lesen", "tikt-team": "–", "tikt-leitung": "Lesen" } },
      { name: "Intranet-Bereich (News, Infos)", detail: "Interne Mitteilungen, Dokumente, Formulare", access: { lernende: "Lesen", lp: "Lesen", lernlounge: "–", "pikt-team": "Lesen/Schr.", "pikt-leitung": "Lesen/Schr.", "tikt-team": "–", "tikt-leitung": "Lesen" } },
      { name: "Autorentool (Kurse erstellen)", detail: "Kurse und Lernressourcen erstellen und bearbeiten", access: { lernende: "–", lp: "Autor", lernlounge: "–", "pikt-team": "Autor", "pikt-leitung": "Autor", "tikt-team": "–", "tikt-leitung": "Autor" } },
      { name: "Benutzerverwaltung", detail: "Konten erstellen, Rollen zuweisen, deaktivieren", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Benutzerverw.", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Katalogverwaltung", detail: "Kurskatalog strukturieren und publizieren", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Verwalter", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Curriculumverwaltung", detail: "Curricula und Lernpfade verwalten", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Verwalter", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Systemkonfiguration", detail: "Module, Einstellungen, Updates", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Modulverwaltung & Caches", detail: "Technische Systemadministration", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "Admin" } },
    ],
  },
  {
    id: "microsoft365",
    title: "Microsoft 365",
    icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    accentColor: "bg-blue-600",
    accentBg: "bg-blue-50",
    description: "Office-Suite, Kommunikationsplattform (Teams) und Speicheroberfläche (OneDrive/SharePoint). Zentrale Infrastruktur für Büroarbeit und Zusammenarbeit.",
    systems: [
      { name: "Teams (Kommunikation)", detail: "Chat, Meetings, Kanäle, Telefonie", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Admin" } },
      { name: "OneNote (Notizbücher)", detail: "Digitale Notizbücher, Kursnotizbücher", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Admin" } },
      { name: "SharePoint / OneDrive", detail: "Dateiablage, Teamseiten, Dokumentenmanagement", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Admin" } },
      { name: "Exchange Online (E-Mail)", detail: "E-Mail, Kalender, Kontakte", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Admin" } },
      { name: "Word / PowerPoint / Excel", detail: "Office-Standardanwendungen", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Nutzer" } },
      { name: "Copilot-Chat", detail: "KI-Assistent (Microsoft)", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Nutzer" } },
      { name: "Forms (Umfragen)", detail: "Umfragen, Quizze, Abstimmungen", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Nutzer" } },
      { name: "Clipchamp (Video)", detail: "Videobearbeitung im Browser", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "Nutzer", "tikt-leitung": "Nutzer" } },
      { name: "M365 Admin Center", detail: "Zentrale Verwaltungskonsole", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "Helpdesk", "tikt-leitung": "Admin" } },
      { name: "Teams Admin Center", detail: "Teams-Richtlinien, Meetings, Kanäle", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "Teams-Adm.", "tikt-leitung": "Admin" } },
      { name: "SharePoint Admin Center", detail: "Sites, Speicher, Freigaben verwalten", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "SP-Admin", "tikt-leitung": "Admin" } },
      { name: "Exchange Admin Center", detail: "Postfächer, Mailfluss, Gruppen", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "Exch.-Adm.", "tikt-leitung": "Admin" } },
      { name: "Entra ID (Benutzerverwaltung)", detail: "Benutzer, Gruppen, Rollen, MFA", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "Global Reader", "tikt-team": "Benutzer-Adm.", "tikt-leitung": "Admin" } },
      { name: "Intune (Geräteverwaltung)", detail: "Geräte, Richtlinien, App-Bereitstellung", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "Intune-Adm.", "tikt-leitung": "Admin" } },
      { name: "Security & Compliance", detail: "Sicherheitsrichtlinien, Datenschutz, Audit", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Lizenzverwaltung", detail: "Lizenz-Zuweisungen und -Übersicht", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "–", "pikt-leitung": "–", "tikt-team": "Lizenz-Adm.", "tikt-leitung": "Admin" } },
    ],
  },
  {
    id: "lerntechnologien",
    title: "Lerntechnologien",
    icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
    accentColor: "bg-violet-600",
    accentBg: "bg-violet-50",
    description: "Kantonslizenzen, BBW-Schullizenzen, Medienarchive, begrenzte Lizenzen, Einzellizenzen und kostenlose Edu-Tools.",
    systems: [
      { name: "fobizz", detail: "Kantonslizenz – KI-Assistenz, Medien", access: { lernende: "via LP", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "to-teach.ai", detail: "Kantonslizenz – Materialgenerator", access: { lernende: "–", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "fellofish", detail: "Kantonslizenz – Gamification", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "brain.study", detail: "Kantonslizenz – Adaptives Lernen", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Adobe Creative Cloud", detail: "BBW-Schullizenz – Organisationszugang", access: { lernende: "–", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "–", "tikt-leitung": "Admin" } },
      { name: "Quizlet", detail: "Begrenzt (24 Lizenzen) – Karteikarten", access: { lernende: "via LP", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Actionbound", detail: "Begrenzt (38 Lizenzen) – Rallyes", access: { lernende: "via LP", lp: "Nutzer", lernlounge: "Admin", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Statista", detail: "Medienarchiv via digithek.ch", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "Admin", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "swissdox", detail: "Medienarchiv via digithek.ch", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "Admin", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "E-Thek", detail: "Medienarchiv via digithek.ch", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "Admin", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Synthesia", detail: "Einzellizenz – KI-Video", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Admin", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Mentimeter", detail: "Einzellizenz – Live-Umfragen", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Admin", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Padlet", detail: "Einzellizenz – Pinnwände", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Admin", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Findmind", detail: "Einzellizenz – Umfragen (Ausnahme möglich)", access: { lernende: "–", lp: "–", lernlounge: "–", "pikt-team": "Admin", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "ChatGPT-Konto", detail: "Einzellizenz – via Lernlounge-Notebook", access: { lernende: "Gruppenarbeit", lp: "–", lernlounge: "Ausleihe", "pikt-team": "Admin", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "learningapps.org", detail: "Kostenlos – Interaktive Übungen", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "simpleshow", detail: "Kostenlos – KI-Erklärvideos", access: { lernende: "–", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "lumi education", detail: "Kostenlos – H5P-Lernbausteine", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Nutzer", "tikt-team": "–", "tikt-leitung": "–" } },
      { name: "Canva Edu", detail: "Kostenlos – Design (BBW-Organisation)", access: { lernende: "Nutzer", lp: "Nutzer", lernlounge: "–", "pikt-team": "Nutzer", "pikt-leitung": "Admin", "tikt-team": "–", "tikt-leitung": "–" } },
    ],
  },
];

// ─── Regeln / Grundsätze ───
export const POLICY_RULES: PolicyRule[] = [
  {
    id: "need-to-know",
    title: "Need-to-know-Prinzip",
    description: "Jede Person erhält nur die Rechte, die für ihre Funktion und Tätigkeit erforderlich sind. Keine pauschalen Admin-Rechte.",
    icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
    color: "text-red-600",
  },
  {
    id: "mfa",
    title: "Multi-Faktor-Authentifizierung",
    description: "Für alle Admin-Zugänge ist MFA Pflicht. Für reguläre Nutzer wird MFA empfohlen.",
    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    color: "text-green-600",
  },
  {
    id: "review",
    title: "Regelmässige Überprüfung",
    description: "Berechtigungen werden jährlich (Mitarbeitende) bzw. halbjährlich (Admin-Rechte) überprüft und bei Bedarf angepasst.",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    color: "text-blue-600",
  },
  {
    id: "segregation",
    title: "Funktionstrennung",
    description: "Bei Mehrfachfunktionen sind Interessenkonflikte zu vermeiden (Segregation of Duties). Kritische Aktionen erfordern Vier-Augen-Prinzip.",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
    color: "text-purple-600",
  },
  {
    id: "least-privilege",
    title: "Least Privilege (M365)",
    description: "Microsoft empfiehlt max. 2–4 Global Admins. Alle anderen erhalten spezifische, feingranulare Rollen (Teams Admin, SharePoint Admin etc.).",
    icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12",
    color: "text-orange-600",
  },
  {
    id: "datenschutz",
    title: "Datenschutz",
    description: "Keine Personendaten in EdTech-Tools eingeben. Keine schulbezogenen oder vertraulichen Informationen. Lernende informieren und sensibilisieren.",
    icon: "M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88",
    color: "text-teal-600",
  },
];

// ─── Prozesse ───
export const PROCESSES: Process[] = [
  {
    id: "setup",
    title: "Einrichten / Ändern von Berechtigungen",
    color: "border-teal-500 bg-teal-50",
    steps: [
      { step: 1, actor: "Personalverantwortliche/r", action: "Meldet personelle Mutation (Eintritt/Wechsel) an die zuständige Stelle." },
      { step: 2, actor: "Vorgesetzte/r", action: "Prüft und genehmigt den Berechtigungsantrag." },
      { step: 3, actor: "TIKT-/PIKT-Leitung", action: "Richtet Berechtigungen gemäss Rollenkonzept ein oder delegiert an Team." },
      { step: 4, actor: "TIKT-/PIKT-Team", action: "Setzt die Berechtigungen in den jeweiligen Systemen um." },
      { step: 5, actor: "Mitarbeiter/in", action: "Erhält Zugang und Initialpasswort (persönlich oder via gesicherten Kanal)." },
    ],
  },
  {
    id: "remove",
    title: "Löschen von Berechtigungen",
    color: "border-red-500 bg-red-50",
    steps: [
      { step: 1, actor: "Personalverantwortliche/r", action: "Meldet den Austritt an TIKT-Leitung und PIKT-Leitung." },
      { step: 2, actor: "TIKT-Leitung", action: "Deaktiviert M365-Konto, entzieht Lizenzen, sperrt Zugang." },
      { step: 3, actor: "PIKT-Leitung", action: "Deaktiviert OpenOlat-Konto, entzieht Lerntechnologie-Zugänge." },
      { step: 4, actor: "Lernlounge", action: "Prüft offene Ausleihen und schliesst diese ab." },
    ],
  },
  {
    id: "password",
    title: "Passwort einrichten / zurücksetzen",
    color: "border-blue-500 bg-blue-50",
    steps: [
      { step: 1, actor: "Mitarbeiter/in", action: "Meldet den Bedarf per Ticket oder E-Mail." },
      { step: 2, actor: "TIKT-Team (Helpdesk)", action: "Prüft Identität (persönlich bekannt oder Ausweis) und setzt Passwort zurück." },
      { step: 3, actor: "Mitarbeiter/in", action: "Ändert Initialpasswort bei der ersten Anmeldung." },
    ],
  },
];

import { ProcessFlow } from "./types";

export const processFlows: ProcessFlow[] = [
  {
    id: "lehrperson",
    title: "Ausgangslage: Start bei Lehrpersonen",
    icon: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
    color: "#2563eb",
    steps: [
      {
        title: "Lizenz-Navigator prüfen",
        description:
          "Die Lehrperson sucht im Lizenz-Navigator BBW nach den vorhandenen Lizenzen. Dort ist auch das Vorgehen beschrieben, wie eine Lizenz zur Verfügung gestellt wird.",
        actor: "Lehrperson",
      },
      {
        title: "PIKT-Team kontaktieren",
        description:
          "Bei bestehenden Einzellizenzen fragt die Lehrperson das PIKT-Team nach einem möglichen Zugriff. Wenn eine Lizenz gewünscht wird, die nicht im Navigator aufgeführt ist, fragt sie das PIKT-Team nach der Möglichkeit einer Anschaffung.",
        actor: "Lehrperson",
      },
      {
        title: "Weiterleitung ans Kernteam",
        description:
          "Das angefragte PIKT-Team-Mitglied leitet die Anfrage weiter in das Kernteam. Dieses traktandiert die Anfrage für eine Sitzung.",
        actor: "PIKT-Team",
      },
      {
        title: "Kernteam-Entscheidung",
        description:
          "Das Kernteam entscheidet, ob eine weitere Abklärung nötig ist. Wenn nicht, wird die Steuergruppe per Leitung PIKT-Team über die Anfrage und den Entscheidungsgrund informiert.",
        actor: "Kernteam",
      },
      {
        title: "Prüfung bestehender Lizenzen",
        description:
          "Entscheidet das Kernteam, dass weitere Abklärungen nötig sind, klärt ein Mitglied des Kernteams ab, ob bestehende Lizenzen die gewünschten Funktionen abdecken.",
        actor: "Kernteam",
      },
      {
        title: "Kantonale Abklärung",
        description:
          "Wenn bestehende Lizenzen nicht ausreichen, klärt das PIKT-Team ab, ob der Kanton ein entsprechendes Tool zur Verfügung stellt bzw. ob ein Einsatz aufgrund Datenschutz und Urheberrecht möglich ist.",
        actor: "PIKT-Team",
      },
      {
        title: "Informationssicherheitsabklärung",
        description:
          "Wenn der Kanton kein Tool zur Verfügung stellt, analysiert die PIKT-Leitung, ob die Informationssicherheitsabklärung selbst durch die BBW durchgeführt werden kann.",
        actor: "PIKT-Leitung",
      },
      {
        title: "Entscheidung Steuergruppe",
        description:
          "Ist eine Durchführung möglich, wird die Anschaffung der Lerntechnologie in einer Steuergruppensitzung besprochen. Die Steuergruppe entscheidet das weitere Vorgehen.",
        actor: "Steuergruppe",
      },
    ],
  },
  {
    id: "pikt-team",
    title: "Ausgangslage: Start bei PIKT-Team",
    icon: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
    color: "#ea580c",
    steps: [
      {
        title: "Handlungsbedarf erkennen",
        description:
          "Ein PIKT-Team-Mitglied sieht Handlungsbedarf im Bereich einer bestimmten Lerntechnologie und trägt das Anliegen in das Kernteam.",
        actor: "PIKT-Team",
      },
      {
        title: "Kernteam-Entscheidung",
        description:
          "Das Kernteam entscheidet, ob eine weitere Abklärung nötig ist. Wenn nicht, wird die Steuergruppe per Leitung PIKT-Team über die Anfrage und den Entscheidungsgrund informiert.",
        actor: "Kernteam",
      },
      {
        title: "Prüfung bestehender Lizenzen",
        description:
          "Entscheidet das Kernteam, dass weitere Abklärungen nötig sind, klärt ein Mitglied des Kernteams ab, ob bestehende Lizenzen die gewünschten Funktionen abdecken.",
        actor: "Kernteam",
      },
      {
        title: "Kantonale Abklärung",
        description:
          "Wenn bestehende Lizenzen nicht ausreichen, klärt das PIKT-Team ab, ob der Kanton ein entsprechendes Tool zur Verfügung stellt bzw. ob ein Einsatz aufgrund Datenschutz und Urheberrecht möglich ist.",
        actor: "PIKT-Team",
      },
      {
        title: "Informationssicherheitsabklärung",
        description:
          "Wenn der Kanton kein Tool zur Verfügung stellt, analysiert die PIKT-Leitung, ob die Informationssicherheitsabklärung selbst durch die BBW durchgeführt werden kann.",
        actor: "PIKT-Leitung",
      },
      {
        title: "Entscheidung Steuergruppe",
        description:
          "Ist eine Durchführung möglich, wird die Anschaffung der Lerntechnologie in einer Steuergruppensitzung besprochen. Die Steuergruppe entscheidet das weitere Vorgehen.",
        actor: "Steuergruppe",
      },
    ],
  },
  {
    id: "steuergruppe",
    title: "Ausgangslage: Start bei Steuergruppe",
    icon: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z",
    color: "#7c3aed",
    steps: [
      {
        title: "Handlungsbedarf erkennen",
        description:
          "Die Steuergruppe sieht Handlungsbedarf im Bereich einer bestimmten Lerntechnologie und klärt weitere Schritte ab.",
        actor: "Steuergruppe",
      },
      {
        title: "Entscheid zur Anschaffung",
        description:
          "Entscheidet die Steuergruppe, dass eine Anschaffung möglich ist, wird das Kernteam darüber informiert.",
        actor: "Steuergruppe",
      },
      {
        title: "Review durch Kernteam",
        description:
          "Das Kernteam gibt eine Review-Meldung zuhanden der Steuergruppe ab.",
        actor: "Kernteam",
      },
      {
        title: "Besprechung & Entscheidung",
        description:
          "Das Review des Kernteams wird in der Steuergruppe besprochen. Die Steuergruppe entscheidet über die Anschaffung der Lerntechnologie.",
        actor: "Steuergruppe",
      },
    ],
  },
];

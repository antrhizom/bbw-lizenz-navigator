# Adminseite einrichten

Die Adminseite liegt unter **`/admin`** (Link ganz unten im Footer). Tools werden in
Firestore gespeichert; die Lizenzübersicht liest sie live von dort. Solange Firestore
leer oder nicht erreichbar ist, zeigt die Übersicht automatisch die statischen Daten
aus [`src/data/tools.ts`](src/data/tools.ts) an – die Seite kann also nicht kaputtgehen.

Einmalige Einrichtung im Firebase-Projekt **`bbw-lizenzen-42`**
(<https://console.firebase.google.com/project/bbw-lizenzen-42>).

Die Web-Konfiguration liegt in Umgebungsvariablen, nicht im Code: lokal in
`.env.local`, für die Live-Version in den Vercel-Projekteinstellungen unter
**Settings → Environment Variables** (`NEXT_PUBLIC_FIREBASE_*`). Weil
`NEXT_PUBLIC_*`-Werte beim Build eingesetzt werden, ist nach einer Änderung ein
**erneuter Deploy** nötig.

## 1. Firestore aktivieren

Firebase-Konsole → **Firestore Database** → *Datenbank erstellen*

- Modus: **Produktion** (die Regeln kommen in Schritt 3)
- Standort: **eur3** oder **europe-west6 (Zürich)** – der Standort ist später nicht
  mehr änderbar

## 2. Anmeldung mit E-Mail und Passwort aktivieren

Firebase-Konsole → **Authentication** → *Erste Schritte* → Anbieter
**E-Mail-/Passwort** aktivieren. «E-Mail-Link (passwortlose Anmeldung)» bleibt
ausgeschaltet.

Es gibt bewusst **keine Selbstregistrierung** in der App – Konten werden
ausschliesslich in der Konsole angelegt (Schritt 4).

Damit die Funktion «Passwort vergessen» E-Mails verschicken kann, unter
**Authentication → Templates** die Sprache auf Deutsch stellen und unter
**Authentication → Settings → Authorized domains** prüfen, dass eingetragen sind:

- `localhost`
- die Vercel-Domain der App (z. B. `bbw-lizenz-navigator.vercel.app`) sowie eine
  allfällige eigene Domain

## 3. Sicherheitsregeln veröffentlichen

Die Regeln liegen im Projekt unter [`firestore.rules`](firestore.rules): Tools sind
öffentlich lesbar, schreiben darf nur, wer in der Whitelist steht.

Entweder per CLI:

```bash
npx firebase-tools deploy --only firestore:rules --project bbw-lizenzen-42
```

Oder den Inhalt von `firestore.rules` in der Konsole unter **Firestore Database →
Regeln** einfügen und veröffentlichen.

## 4. Adminkonten anlegen und freischalten

Pro Person sind **zwei** Schritte nötig: das Konto und der Whitelist-Eintrag. Beides
nur in der Firebase-Konsole – die App kann weder Konten anlegen noch Rechte vergeben.

### 4a. Konto anlegen

Firebase-Konsole → **Authentication** → **Users** → *Nutzer hinzufügen*

- E-Mail: die Adresse der Person (Kleinbuchstaben)
- Passwort: ein Initialpasswort setzen und der Person auf einem sicheren Weg
  mitteilen. Sie kann es nach dem ersten Login unter «Passwort ändern» selbst
  ersetzen.

### 4b. In die Whitelist eintragen

Die Whitelist ist die Firestore-Collection **`admins`**. Nur wer dort steht, darf
schreiben – ein Konto allein genügt nicht.

Firebase-Konsole → **Firestore Database** → *Sammlung starten*

- Sammlungs-ID: `admins`
- Dokument-ID: die **E-Mail-Adresse in Kleinbuchstaben**, z. B.
  `vorname.nachname@bbw.ch`
- Feld (frei wählbar, nur zur Orientierung): `name` → `Vorname Nachname`

Für jede weitere berechtigte Person ein zusätzliches Dokument anlegen.

**Zugriff entziehen:** Dokument in `admins` löschen (entzieht die Schreibrechte) und
das Konto unter **Authentication → Users** deaktivieren oder löschen (verhindert die
Anmeldung).

## 5. Bestehende Tools übernehmen

Nach dem ersten Login auf `/admin` erscheint der Hinweis «Noch keine Tools in der
Datenbank» mit der Schaltfläche **«… bestehende Tools übernehmen»**. Ein Klick
kopiert die Tools aus `src/data/tools.ts` nach Firestore. Vorhandene Einträge werden
dabei nie überschrieben – der Import kann also gefahrlos wiederholt werden.

Ab diesem Moment ist Firestore die führende Datenquelle. `src/data/tools.ts` bleibt
als Fallback bestehen und muss nicht mehr gepflegt werden.

---

## Bedienung

- **Neues Tool erfassen** – Formular mit allen Feldern der Lizenzübersicht. Die
  Kurz-ID wird aus dem Namen gebildet und ist nach dem Anlegen fix.
- **Entwurf** – mit «Als Entwurf behalten» ist ein Eintrag in der Administration
  sichtbar, in der öffentlichen Übersicht aber nicht. Der Status lässt sich in der
  Liste per Klick auf das Statusfeld umschalten.
- **Sortierposition** – kleinere Zahl = weiter vorne. Ohne Angabe wird alphabetisch
  am Ende einsortiert.
- **Änderungen** sind sofort live, ohne Deploy.
- **Passwort ändern** – rechts oben in der Adminansicht. Liegt die Anmeldung länger
  zurück, verlangt Firebase vorher ein erneutes Einloggen; die Seite weist darauf hin.
- **Passwort vergessen** – Link im Anmeldeformular, verschickt eine E-Mail zum
  Zurücksetzen an die eingegebene Adresse.

### Was nicht über die Adminseite geht

**Anleitungs-PDFs.** Die Dateien liegen im Repository unter `public/anleitungen/`.
Im Formular wird nur der Pfad verknüpft (z. B. `/anleitungen/canva.pdf`). Eine neue
PDF-Datei muss also zuerst dort abgelegt und deployt werden; danach kann sie in der
Adminseite beliebig oft verknüpft werden.



# Produktionsreife-Check: LohnPro

## Status-Zusammenfassung

Die App ist **funktional zu ~85% produktionsreif**. Kernlogik (Steuerberechnung, SV-Beiträge, Meldewesen, Mandantenfähigkeit, Authentifizierung, RLS) funktioniert. Es gibt jedoch mehrere Punkte, die vor einem Live-Gang mit Steuerberaterqualität behoben werden muessen.

---

## Kritische Probleme (Blocker)

### 1. Testdaten in Produktion
Die Testmitarbeiterin "Anna Testmeier" und zugehoerige Payroll-Eintraege befinden sich noch in der Datenbank. Diese muessen vor Go-Live geloescht werden.

### 2. Toter Code: use-secure-employee-storage.ts
`src/hooks/use-secure-employee-storage.ts` exportiert noch `useEmployeeStorage` als Alias fuer eine localStorage-basierte Implementierung. Obwohl `use-employee-storage.ts` korrekt auf Supabase zeigt, koennte ein falscher Import zu Datenverlust fuehren. Die Datei sollte entfernt oder als deprecated markiert werden.

### 3. Fehlende Foreign Keys
Keine einzige Tabelle hat Foreign Keys definiert. Das bedeutet:
- `payroll_entries.employee_id` kann auf nicht-existierende Mitarbeiter zeigen
- `tenant_members.tenant_id` / `user_id` sind nicht referentiell geschuetzt
- Beim Loeschen eines Mitarbeiters bleiben verwaiste Payroll-Eintraege zurueck

### 4. Fehlende Personalnummern-Generierung
`personal_number` ist NULL bei allen Mitarbeitern. Fuer eine professionelle Lohnabrechnung ist eine eindeutige Personalnummer Pflicht.

---

## Wichtige Verbesserungen (Empfohlen)

### 5. Passwort-Sicherheit
Kein HIBP-Check aktiviert. Fuer Steuerberaterqualitaet sollte Leaked-Password-Protection aktiviert werden.

### 6. Registrierung: Kein Auto-Login nach Signup
Nach der Registrierung muss sich der Nutzer manuell einloggen, obwohl `auto_confirm_email` aktiv ist. Die UX sollte direkt einloggen.

### 7. SV-Meldungen: Fehlende Validierung
- Kein Check ob Meldezeitraum mit Beschaeftigungszeitraum uebereinstimmt
- Keine Pruefung auf doppelte Meldungen (gleicher Mitarbeiter, gleicher Zeitraum, gleicher Grund)

### 8. Beitragsnachweise: Fehlende Zahlungsfrist-Berechnung
Das `faelligkeitsdatum` wird nicht automatisch gesetzt (drittletzter Bankarbeitstag des Monats).

### 9. Audit-Log: Client-seitige Inserts blockiert
Die `audit_log`-Tabelle hat keine INSERT-Policy. Die Audit-Trigger verwenden `SECURITY DEFINER` und funktionieren, aber direkte Client-Inserts (z.B. fuer Login-Events) schlagen fehl.

---

## Umsetzungsplan

### Schritt 1: Testdaten bereinigen
Migration: Loesche Anna Testmeier, zugehoerige payroll_entries, payroll_periods, beitragsnachweise, lohnsteuerbescheinigungen und sv_meldungen.

### Schritt 2: Foreign Keys einfuegen
Migration mit Foreign Keys und ON DELETE CASCADE/RESTRICT:
- `payroll_entries.employee_id` -> `employees.id`
- `payroll_entries.payroll_period_id` -> `payroll_periods.id`
- `sv_meldungen.employee_id` -> `employees.id`
- `lohnsteuerbescheinigungen.employee_id` -> `employees.id`
- `tenant_members.tenant_id` -> `tenants.id`
- `tenant_members.user_id` -> `auth.users.id`
- `profiles.user_id` -> `auth.users.id`
- `user_roles.user_id` -> `auth.users.id`

### Schritt 3: Personalnummern-Automatik
Datenbank-Funktion + Trigger: Automatische Generierung einer fortlaufenden Personalnummer pro Tenant (z.B. `1001`, `1002`, ...).

### Schritt 4: Toten Code entfernen
- `use-secure-employee-storage.ts` loeschen (localStorage-Variante)
- `src/lib/secure-storage.ts` loeschen (nicht mehr benoetigt mit Supabase)

### Schritt 5: Sicherheit haerten
- HIBP-Check aktivieren via `configure_auth`
- Auto-Login nach Registrierung implementieren

### Schritt 6: Audit-Log INSERT-Policy
Policy hinzufuegen: Authentifizierte Nutzer koennen Audit-Eintraege fuer ihren Tenant erstellen.

### Schritt 7: SV-Meldungen Duplikat-Check
Client-seitige Validierung vor dem Speichern + Unique Constraint auf `(employee_id, meldegrund, zeitraum_von, zeitraum_bis, tenant_id)`.

---

## Technische Details

```text
Aenderungen:
  Migrationen:     3-4 SQL-Dateien
  Geloeschte Files: 2 (secure-storage, secure-employee-storage)
  Geaenderte Files: 2-3 (Auth.tsx, sv-meldungen-page.tsx)
  Neue Files:       0
```

Geschaetzter Aufwand: 1 Nachricht fuer Schritte 1-6, 1 Nachricht fuer Schritt 7 + Endtest.


## Ziel
Der Header in `MainLayout` ist mit 10 Nav-Items + Profilbereich überladen und bricht visuell. Wir entlasten die Top-Bar, gruppieren Sekundärnavigation und legen "Einstellungen", Mandant, Theme und "Abmelden" sauber unter ein Profil-Dropdown.

## Neue Header-Struktur (Desktop)

```text
[L Logo  LohnPro]   [Dashboard] [Mitarbeiter] [Abrechnung] [Zeiterfassung] [Mehr ▾]   [🌓] [👤 user@… ▾]
                                                                              │                  │
                                                                              │                  ├─ Mein Portal
                                                                              │                  ├─ Mandant wechseln ▸
                                                                              │                  ├─ Einstellungen
                                                                              │                  ├─ ─────────
                                                                              │                  └─ Abmelden
                                                                              │
                                                                              ├─ Meldewesen
                                                                              ├─ Reisekosten
                                                                              ├─ Steuerberater
                                                                              └─ Autolohn
```

### Primärnavigation (immer sichtbar)
Dashboard · Mitarbeiter · Abrechnung · Zeiterfassung

### "Mehr"-Dropdown (Sekundär, fachlich gruppiert)
- Compliance: Meldewesen, Steuerberater
- Operativ: Reisekosten, Autolohn

### Profil-Dropdown (rechts, ersetzt aktuelle Inline-Anzeige)
- Kopfzeile: E-Mail + Rollen-Badge
- Mein Portal
- Mandant wechseln (Submenü mit Tenants, ersetzt Inline-`TenantSwitcher`)
- Einstellungen
- Trennlinie
- Abmelden (destructive)

Theme-Toggle bleibt als eigenständiger Icon-Button neben dem Profil (häufig genutzt, ein Klick).

## Mobile

- Hamburger öffnet Sheet (Slide-In von rechts) statt aktueller Inline-Akkordeon-Liste.
- Reihenfolge: Primär-Items → Trennlinie → Sekundär-Items → Trennlinie → Profilblock (Mandant, Einstellungen, Theme, Abmelden).

## Technische Details

- Datei: `src/components/layout/main-layout.tsx` (einzige Änderung an Layout-Code).
- Verwendete shadcn-Komponenten: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSub`, `DropdownMenuSeparator`, `DropdownMenuLabel`, `Sheet` (mobile).
- `navItems` wird aufgeteilt in `primaryNavItems` und `secondaryNavItems`. `/settings` und `/portal` aus `navItems` entfernt – wandern ins Profil-Dropdown.
- `TenantSwitcher`: Im Desktop-Header wird die separate Komponente entfernt; stattdessen rendern wir die Tenant-Liste direkt im `DropdownMenuSub` über `useTenant()`. Mobile bekommt sie ebenfalls im Sheet.
- Aktiver Zustand: Primär-Buttons wie bisher (`text-primary font-medium`); für "Mehr"-Trigger zeigen wir aktiven Stil, wenn ein Sekundär-Item aktiv ist.
- Aria: `aria-current="page"`, `aria-haspopup`, `aria-expanded` für Dropdown-Trigger; Skip-Link bleibt.
- Keine Logikänderung an Auth, Routing, Tenant-Switching, Dark-Mode.

## Out of Scope
- Keine neuen Routen, kein Sidebar-Umbau, keine Backend-/Payroll-Änderung.
- `LegalLayout` bleibt unverändert (eigener Header für rechtliche Seiten).


# Bereinigung: Testnutzer entfernen

Der End-to-End-Test war erfolgreich. Der Testnutzer `test@lohnpro-test.de` sollte nun entfernt werden.

## Aktion

Eine Migration erstellen, die den Testnutzer `dfffb999-0a2e-4bd5-b302-84f66178c8b7` und alle zugehörigen Daten (tenant_members, user_roles, profiles, tenants) löscht.

## Hinweis zur Toast-Meldung

Nach der Registrierung zeigt der Toast "Bitte bestätigen Sie Ihre E-Mail-Adresse", obwohl Auto-Confirm aktiv ist. Der Nutzer wird trotzdem sofort freigeschaltet. Optional könnte die Meldung angepasst werden, um Verwirrung zu vermeiden.

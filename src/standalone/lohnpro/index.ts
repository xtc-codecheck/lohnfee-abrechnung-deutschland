/**
 * Standalone Entry Point für SYSTAX-Integration
 * ──────────────────────────────────────────────
 * Erlaubt das Mounten der gesamten LohnPro-App als Sub-App
 * im SYSTAX-Hauptsystem.
 *
 * Beispiel-Integration in SYSTAX:
 *
 *   import { StandaloneLohnProApp } from '@lohnpro/standalone';
 *   <Route path="/lohn/*" element={<StandaloneLohnProApp basePath="/lohn" />} />
 */
export { StandaloneLohnProApp } from './StandaloneLohnProApp';
export type { StandaloneLohnProAppProps } from './StandaloneLohnProApp';

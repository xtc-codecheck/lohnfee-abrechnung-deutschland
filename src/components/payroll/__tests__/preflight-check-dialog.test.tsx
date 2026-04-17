import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreFlightCheckDialog } from "../preflight-check-dialog";
import type { PayrollAnomaly } from "@/types/payroll-guardian";

// Mock der Anomalie-Erkennung, um Renderverhalten isoliert zu testen
vi.mock("@/utils/anomaly-detection", () => ({
  detectAnomalies: vi.fn(),
}));

import { detectAnomalies } from "@/utils/anomaly-detection";

const makeAnomaly = (
  severity: PayrollAnomaly["severity"],
  id = `a-${severity}`
): PayrollAnomaly => ({
  id,
  type: "salary-spike",
  severity,
  employeeId: "emp-1",
  employeeName: "Max Mustermann",
  title: `Anomalie ${severity}`,
  description: "Testbeschreibung",
  currentValue: 5000,
  detectedAt: new Date(),
  period: "2026-04",
  isResolved: false,
});

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  employees: [],
  entries: [],
  history: [],
  onConfirm: vi.fn(),
};

describe("PreFlightCheckDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rendert grünen Erfolgs-Banner ohne Anomalien und keine destruktive Variante", () => {
    vi.mocked(detectAnomalies).mockReturnValue([]);

    render(<PreFlightCheckDialog {...baseProps} />);

    expect(screen.getByText(/Pre-Flight-Check bestanden/i)).toBeInTheDocument();

    const action = screen.getByRole("button", { name: "Speichern" });
    expect(action.className).not.toMatch(/bg-destructive/);
  });

  it("zeigt bei kritischen Anomalien einen roten (destruktiven) Bestätigungs-Button", () => {
    vi.mocked(detectAnomalies).mockReturnValue([
      makeAnomaly("critical"),
      makeAnomaly("high", "a-high"),
    ]);

    render(<PreFlightCheckDialog {...baseProps} />);

    // Header signalisiert kritische Funde
    expect(
      screen.getByText(/Kritische Auffälligkeiten gefunden/i)
    ).toBeInTheDocument();

    // Button hat destruktive Variante (rot)
    const action = screen.getByRole("button", { name: /Trotzdem speichern/i });
    expect(action.className).toMatch(/bg-destructive/);
    expect(action.className).toMatch(/text-destructive-foreground/);
  });

  it("rendert nicht-destruktiven Button bei nur mittleren/hohen Funden ohne Critical", () => {
    vi.mocked(detectAnomalies).mockReturnValue([makeAnomaly("high", "a-high")]);

    render(<PreFlightCheckDialog {...baseProps} />);

    expect(screen.getByText(/Hinweise vor dem Speichern/i)).toBeInTheDocument();

    const action = screen.getByRole("button", { name: /Trotzdem speichern/i });
    expect(action.className).not.toMatch(/bg-destructive/);
  });
});

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  type ISystaxIntegration,
  SystaxIntegrationStub,
} from "@/types/systax-integration";

interface SystaxContextValue {
  integration: ISystaxIntegration;
  isStandalone: boolean;
}

const SystaxContext = createContext<SystaxContextValue | null>(null);

export function SystaxProvider({
  integration,
  children,
}: {
  integration?: ISystaxIntegration;
  children: ReactNode;
}) {
  const value = useMemo<SystaxContextValue>(() => {
    const impl = integration ?? new SystaxIntegrationStub();
    return {
      integration: impl,
      isStandalone: impl instanceof SystaxIntegrationStub,
    };
  }, [integration]);

  return (
    <SystaxContext.Provider value={value}>{children}</SystaxContext.Provider>
  );
}

export function useSystax(): SystaxContextValue {
  const ctx = useContext(SystaxContext);
  if (!ctx) {
    throw new Error("useSystax must be used within a SystaxProvider");
  }
  return ctx;
}

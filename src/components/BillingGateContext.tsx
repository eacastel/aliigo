"use client";

import { createContext, useContext } from "react";

type BillingGateState = {
  status: "loading" | "active" | "inactive";
  isActive: boolean;
};

const BillingGateContext = createContext<BillingGateState>({
  status: "loading",
  isActive: false,
});

export const BillingGateProvider = BillingGateContext.Provider;

export function useBillingGate() {
  return useContext(BillingGateContext);
}

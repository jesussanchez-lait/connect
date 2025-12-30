"use client";

import React from "react";
import { ToastProvider } from "@/src/presentation/contexts/ToastContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

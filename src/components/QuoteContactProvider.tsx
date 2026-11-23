'use client';

import { createContext, useContext, type ReactNode } from 'react';

const QuoteContactContext = createContext<string | null>(null);
export const useQuoteZaloUrl = () => useContext(QuoteContactContext);

// Server-resolved contact data without changing QuoteRequestForm's public props.
export function QuoteContactProvider({ zaloUrl, children }: { zaloUrl: string | null; children: ReactNode }) {
  return <QuoteContactContext value={zaloUrl}>{children}</QuoteContactContext>;
}

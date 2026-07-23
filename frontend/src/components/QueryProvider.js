"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Les données sont réputées fraîches pendant 5 minutes
            refetchOnWindowFocus: true, // Rechargement intelligent en arrière-plan
            retry: 1, // 1 tentative de réessai en cas d'échec
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

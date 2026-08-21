"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/use-auth";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Sin esto, TanStack Query vuelve a pedir todo cada vez que la
          // pestaña recupera el foco o un componente se remonta — incluso
          // datos que no cambiaron. Las mutaciones ya actualizan el cache
          // al toque (setQueryData/invalidateQueries en cada hook), así
          // que 30s de margen no muestra información vieja en la práctica.
          queries: { staleTime: 30_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

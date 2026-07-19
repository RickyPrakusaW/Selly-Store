'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/api';
import { useSeliStore } from '@/lib/store';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const setUser = useSeliStore((state) => state.setUser);

  useEffect(() => {
    void fetchMe().then(setUser).catch(() => setUser(null));
  }, [setUser]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

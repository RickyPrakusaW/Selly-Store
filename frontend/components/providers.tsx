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
  const loadCart = useSeliStore((state) => state.loadCart);
  const toast = useSeliStore((state) => state.toast);
  const clearToast = useSeliStore((state) => state.clearToast);

  useEffect(() => {
    void fetchMe()
      .then((user) => {
        setUser(user);
        if (user) void loadCart();
      })
      .catch(() => setUser(null));
  }, [setUser, loadCart]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {toast && (
        <div className={`toast-banner toast-${toast.type}`} onClick={clearToast}>
          <span>{toast.message}</span>
        </div>
      )}
    </QueryClientProvider>
  );
}

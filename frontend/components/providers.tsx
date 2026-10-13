'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchMe } from '@/lib/api';
import { useSeliStore } from '@/lib/store';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important so we don't re-make a new client if React
  // suspends during the initial render or during HMR/Fast Refresh.
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  const setUser = useSeliStore((state) => state.setUser);
  const loadCart = useSeliStore((state) => state.loadCart);
  const toast = useSeliStore((state) => state.toast);
  const clearToast = useSeliStore((state) => state.clearToast);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Wipe legacy unauthenticated wishlist to prevent stray badges
      localStorage.removeItem('seli_wishlist');
    }
    void fetchMe()
      .then((user) => {
        setUser(user);
        if (user) void loadCart();
      })
      .catch(() => {
        setUser(null);
      });
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

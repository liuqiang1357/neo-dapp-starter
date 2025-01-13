'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { FC, ReactNode } from 'react';
import { store } from '@/lib/utils/jotai';
import { queryClient } from '@/lib/utils/react-query';
import { Toaster } from '@/ui/shadcn/sonner';
import { ErrorHandler } from './error-handler';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <JotaiProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <ErrorHandler />
          {children}
        </NextThemesProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
};

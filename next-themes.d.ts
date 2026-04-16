declare module 'next-themes' {
  import { ReactNode } from 'react';
  interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    children: ReactNode;
  }
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  export function useTheme(): {
    theme: string;
    setTheme: (theme: string) => void;
    systemTheme?: string;
    resolvedTheme?: string;
  };
}

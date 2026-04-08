import { AuthProvider }  from '@/context/AuthContext';
import { ToastProvider } from '@/components/common/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary     from '@/components/common/ErrorBoundary';
import AppRouter         from '@/router/AppRouter';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
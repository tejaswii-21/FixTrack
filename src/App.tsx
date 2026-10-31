// Root App component.
//
// Wraps the app in ThemeProvider (dark mode), AuthProvider (mock auth for
// Phase 1), and BrowserRouter (routing). The Toaster is inside ThemeProvider
// so toast colors match the active theme.
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import AppRoutes from '@/routes'

/** Toaster that follows the current theme (light/dark). */
function AppToaster() {
  const { theme } = useTheme()
  return <Toaster richColors position="top-right" theme={theme} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <AppToaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

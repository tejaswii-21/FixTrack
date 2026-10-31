// NotFound page: 404 shown for any unmatched route.
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Page Not Found
          </h1>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            className="mt-2"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

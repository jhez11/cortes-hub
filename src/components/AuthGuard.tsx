import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, Lock } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: 'redirect' | 'message' | 'inline';
  message?: string;
}

export const AuthGuard = ({ 
  children, 
  fallback = 'message',
  message = 'You must be logged in to perform this action.'
}: AuthGuardProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!user) {
    if (fallback === 'redirect') {
      navigate('/auth');
      return null;
    }

    if (fallback === 'inline') {
      return (
        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-sm">
          <Lock className="h-4 w-4 text-warning shrink-0" />
          <span className="text-warning">{message}</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/auth')}
            className="ml-auto shrink-0"
          >
            Sign In
          </Button>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/auth')} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for checking auth in action handlers
export const useAuthAction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (callback: () => void) => {
    if (!user) {
      // Using sonner toast
      import('sonner').then(({ toast }) => {
        toast.error('You must be logged in to perform this action.', {
          action: {
            label: 'Sign In',
            onClick: () => navigate('/auth'),
          },
        });
      });
      return;
    }
    callback();
  };

  return { requireAuth, isAuthenticated: !!user };
};

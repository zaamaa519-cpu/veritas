'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chrome, Twitter, CheckCircle2, XCircle } from 'lucide-react';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { useToast } from '@/hooks/use-toast';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; message: string; provider?: string } | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const provider = params.get('provider');

    if (success === 'true') {
      const providerName = provider === 'google' ? 'Google' : provider === 'twitter' ? 'Twitter' : 'OAuth';
      setOauthMessage({
        type: 'success',
        message: `Successfully logged in with ${providerName}! Redirecting...`,
        provider: providerName
      });
      
      toast({
        title: 'Login Successful',
        description: `You've been logged in with ${providerName}.`,
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else if (error) {
      const providerName = provider === 'google' ? 'Google' : provider === 'twitter' ? 'Twitter' : 'OAuth';
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error === 'oauth_cancelled') {
        errorMessage = 'Authentication was cancelled.';
      } else if (error === 'oauth_invalid_state') {
        errorMessage = 'Invalid authentication state. Please try again.';
      } else if (error.includes('redirect_uri_mismatch')) {
        errorMessage = 'OAuth configuration error. Please contact support.';
      }
      
      setOauthMessage({
        type: 'error',
        message: `${providerName} login failed: ${errorMessage}`,
        provider: providerName
      });

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [router, toast]);
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Signed in',
        description: 'Welcome back to Veritas AI.',
      });
      router.push('/');
    } catch (err: any) {
      const message = err?.message || 'Unexpected error during sign-in.';
      setError(message);
      toast({
        title: 'Sign-in Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Not Available',
      description: 'Password reset is coming soon.',
      variant: 'destructive',
    });
  };

  const handleGoogleSignIn = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/google';
    }
  };

  const handleTwitterSignIn = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/twitter';
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-theme(spacing.14))] items-center justify-center p-4 overflow-hidden">
       <AnimatedCharacter className="absolute -top-1/4 -left-1/4 w-1/2 h-auto opacity-10" />
       <AnimatedCharacter className="absolute -bottom-1/4 -right-1/4 w-1/2 h-auto opacity-10" animationDirection="reverse" />
      <Card className="w-full max-w-sm border-primary/20 bg-card/80 backdrop-blur-xl glow-shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your analysis history and contribute.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {oauthMessage && (
            <Alert variant={oauthMessage.type === 'success' ? 'default' : 'destructive'}>
              {oauthMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>{oauthMessage.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{oauthMessage.message}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleEmailSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleGoogleSignIn}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={handleTwitterSignIn}>
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm">
           <div className="flex justify-between w-full">
             <Link href="#" onClick={handlePasswordReset} className="underline text-muted-foreground hover:text-primary">
                Forgot password?
             </Link>
             <Link href="/register" className="underline text-muted-foreground hover:text-primary">
                Sign up
             </Link>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}

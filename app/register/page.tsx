'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/contexts/auth-context';
import { Chrome, Twitter } from 'lucide-react';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.');


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      passwordSchema.parse(password);
    } catch (err: any) {
      const validationError =
        err?.issues?.[0]?.message ?? err?.message ?? 'Invalid password.';
      setError(validationError);
      toast({
        title: 'Invalid Password',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      toast({
        title: 'Account Created',
        description: 'Welcome to Veritas AI! You have been signed in.',
      });
      router.push('/');
    } catch (err: any) {
      const message = err?.message || 'Unexpected error during sign-up.';
      setError(message);
      toast({
        title: 'Sign-up Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-theme(spacing.14))] items-center justify-center p-4 overflow-hidden">
      <AnimatedCharacter className="absolute -top-1/4 -left-1/4 w-1/2 h-auto opacity-10" />
      <AnimatedCharacter className="absolute -bottom-1/4 -right-1/4 w-1/2 h-auto opacity-10" animationDirection="reverse" />
      <Card className="w-full max-w-sm border-primary/20 bg-card/80 backdrop-blur-xl glow-shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join Veritas AI to start your fact-checking journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="John Doe" required value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>At least 8 characters</li>
                <li>Contains a number</li>
                <li>Contains a special character</li>
                <li>Contains an uppercase letter</li>
            </ul>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button variant="outline" onClick={() => window.location.href = '/api/auth/google'}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/api/auth/twitter'}>
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm">
            <p>Already have an account?{' '}
                <Link href="/login" className="underline text-primary hover:text-primary/80">
                    Sign in
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

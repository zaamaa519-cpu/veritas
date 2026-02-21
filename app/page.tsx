'use client';

import { useEffect } from 'react';
import { AnimatedHomePage } from '@/components/veritas-ai/home-page';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const provider = params.get('provider');

    if (oauthSuccess === 'true') {
      const providerName = provider === 'google' ? 'Google' : provider === 'twitter' ? 'Twitter' : 'OAuth';
      
      // Refresh user data
      refreshUser();
      
      // Show success toast
      toast({
        title: 'Login Successful!',
        description: `You've been logged in with ${providerName}.`,
      });

      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [refreshUser, toast]);

  return (
    <>
      <AnimatedHomePage />
    </>
  );
}

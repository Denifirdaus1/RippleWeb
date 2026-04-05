'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../../data/repositories/auth_service';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    AuthService.getCurrentUser()
      .then((nextUser) => {
        if (!isMounted) return;
        setUser(nextUser);
      })
      .catch((error) => {
        console.error('Failed to restore auth session.', error);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((nextUser) => {
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, signOut: AuthService.signOut };
};

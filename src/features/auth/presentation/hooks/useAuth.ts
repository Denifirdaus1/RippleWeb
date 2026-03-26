'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../../data/repositories/auth_service';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    AuthService.getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, signOut: AuthService.signOut };
};
